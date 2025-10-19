const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const File = require('../models/File');
const uploadService = require('../services/uploadService');
const geminiService = require('../services/geminiService');

// Test route to check if Gemini service is working
router.get('/test-gemini', auth, async (req, res) => {
  try {
    console.log('Testing Gemini service...');
    const result = await geminiService.generateHealthTips('general');
    console.log('Gemini test result:', result);
    res.json({
      success: true,
      message: 'Gemini service is working',
      data: result
    });
  } catch (error) {
    console.error('Gemini test error:', error);
    res.status(500).json({
      success: false,
      message: 'Gemini service test failed',
      error: error.message
    });
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// Upload medical report files
router.post('/upload', auth, upload.array('files', 5), async (req, res) => {
  try {
    console.log('Upload request received:', {
      filesCount: req.files ? req.files.length : 0,
      body: req.body,
      user: req.user ? req.user._id : 'no user'
    });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { reportType, reportDate, doctorName, hospitalName, notes } = req.body;

    if (!reportType || !reportDate) {
      return res.status(400).json({
        success: false,
        message: 'Report type and date are required'
      });
    }

    const uploadedFiles = [];
    const fileAnalysisPromises = [];

    // Process each uploaded file
    for (const file of req.files) {
      try {
        console.log('Processing file:', file.originalname, 'Size:', file.size);
        
        // Create temporary file from buffer
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFilePath = path.join(tempDir, `${Date.now()}_${file.originalname}`);
        
        // Write buffer to temporary file
        fs.writeFileSync(tempFilePath, file.buffer);
        console.log('Temporary file created:', tempFilePath);
        
        // Upload to Cloudinary
        console.log('Uploading to Cloudinary...');
        const uploadResult = await uploadService.uploadToCloudinary(tempFilePath, {
          folder: 'healthmate/reports',
          resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
          public_id: `${req.user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        console.log('Cloudinary upload result:', uploadResult);
        
        // Clean up temporary file
        fs.unlinkSync(tempFilePath);

        if (!uploadResult) {
          throw new Error('File upload failed');
        }

        uploadedFiles.push({
          originalName: file.originalname,
          cloudinaryId: uploadResult.publicId,
          url: uploadResult.url,
          format: uploadResult.format,
          size: file.size,
          mimeType: file.mimetype
        });

        // Queue AI analysis for images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
          console.log('Queueing AI analysis for file:', file.originalname, 'URL:', uploadResult.url);
          fileAnalysisPromises.push(
            geminiService.analyzeMedicalReportFromUrl(
              uploadResult.url,
              file.mimetype,
              reportType
            ).then(analysis => {
              console.log('AI analysis completed for file:', file.originalname);
              console.log('Analysis result:', JSON.stringify(analysis, null, 2));
              return analysis;
            }).catch(error => {
              console.error('AI analysis error for file:', file.originalname, error);
              return null; // Don't fail the entire upload if AI analysis fails
            })
          );
        }

      } catch (error) {
        console.error('File processing error for file:', file.originalname, error);
        // Continue with other files even if one fails
      }
    }

    // Create file record in database
    console.log('Creating file record in database...');
    const fileRecord = new File({
      user: req.user.id,
      reportType,
      reportDate: new Date(reportDate),
      doctorName: doctorName || '',
      hospitalName: hospitalName || '',
      notes: notes || '',
      files: uploadedFiles,
      status: 'uploaded',
      uploadedAt: new Date()
    });

    await fileRecord.save();
    console.log('File record saved:', fileRecord._id);

    // Perform AI analysis in background
    if (fileAnalysisPromises.length > 0) {
      console.log('Starting AI analysis for', fileAnalysisPromises.length, 'files...');
      Promise.all(fileAnalysisPromises).then(async (analyses) => {
        try {
          console.log('All AI analyses completed. Results:', analyses.length);
          const validAnalyses = analyses.filter(analysis => analysis !== null);
          console.log('Valid analyses:', validAnalyses.length);
          
          if (validAnalyses.length > 0) {
            // Update file record with AI analysis
            fileRecord.aiAnalysis = validAnalyses;
            fileRecord.status = 'analyzed';
            await fileRecord.save();
            console.log('File record updated with AI analysis');

            // Create AI insights
            console.log('🤖 Creating AI insights from analysis results...');
            for (const analysis of validAnalyses) {
              if (analysis && analysis.summary) {
                console.log('🤖 Processing analysis for insight creation:', analysis.summary?.english || analysis.summary);
                console.log('Creating AI insight with analysis:', JSON.stringify(analysis, null, 2));
                
                const Insight = require('../models/AiInsight');
                const insight = new Insight({
                  user: req.user.id,
                  file: fileRecord._id,
                  type: 'report_analysis',
                  title: `Analysis: ${reportType}`,
                  summary: analysis.summary,
                  keyFindings: analysis.keyFindings || [],
                  abnormalValues: analysis.abnormalValues || [],
                  doctorQuestions: analysis.doctorQuestions || [],
                  recommendations: analysis.recommendations || { lifestyle: [], medical: [] },
                  riskFactors: analysis.riskFactors || [],
                  followUpSuggestions: analysis.followUpSuggestions || [],
                  confidence: analysis.confidence || 85,
                  language: 'both', // English + Roman Urdu
                  model: 'gemini-2.5-flash',
                  processingTime: analysis.processingTime || 0,
                  disclaimers: analysis.disclaimers || {
                    aiDisclaimer: {
                      english: "This analysis is generated by AI and is for informational purposes only. Always consult with a qualified healthcare professional for medical advice.",
                      urdu: "Yeh analysis AI ke zariye generate hui hai aur sirf information ke liye hai. Medical advice ke liye hamesha qualified doctor se consult karein."
                    },
                    medicalDisclaimer: {
                      english: "This information should not replace professional medical advice, diagnosis, or treatment. Seek immediate medical attention for emergencies.",
                      urdu: "Yeh information professional medical advice, diagnosis ya treatment ka replacement nahi hai. Emergency cases mein immediately doctor se contact karein."
                    }
                  }
                });
                
                await insight.save();
                console.log('✅ AI insight saved successfully:', insight._id);
              } else {
                console.log('❌ Skipping analysis - no summary found:', analysis);
              }
            }
          } else {
            console.log('❌ No valid analyses to save');
          }
        } catch (error) {
          console.error('❌ Error processing AI analysis:', error);
          console.error('Error stack:', error.stack);
        }
      }).catch(error => {
        console.error('❌ Error in AI analysis Promise.all:', error);
        console.error('Error stack:', error.stack);
      });
    } else {
      console.log('No files eligible for AI analysis');
    }

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        file: fileRecord,
        uploadedFiles: uploadedFiles.length
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Get user's files
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };
    if (type) {
      query.reportType = type;
    }

    const files = await File.find(query)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email');

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      data: files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files',
      error: error.message
    });
  }
});

// Get specific file
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('user', 'name email');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      data: file
    });

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file',
      error: error.message
    });
  }
});

// Delete file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete from Cloudinary
    for (const fileData of file.files) {
      try {
        await uploadService.deleteFromCloudinary(fileData.cloudinaryId);
      } catch (error) {
        console.error('Cloudinary delete error:', error);
        // Continue even if Cloudinary deletion fails
      }
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id);

    // Delete related AI insights
    const Insight = require('../models/AiInsight');
    await Insight.deleteMany({ file: req.params.id });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
});

// Download file
router.get('/:id/download', auth, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const fileIndex = parseInt(req.query.index) || 0;
    if (fileIndex >= file.files.length) {
      return res.status(404).json({
        success: false,
        message: 'File index out of range'
      });
    }

    const fileData = file.files[fileIndex];
    
    // Redirect to Cloudinary URL for download
    res.redirect(fileData.url);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
});

// Get file statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await File.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: { $sum: '$files.size' } },
          reportTypes: { $addToSet: '$reportType' },
          lastUpload: { $max: '$uploadedAt' }
        }
      }
    ]);

    const reportTypeStats = await File.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalFiles: 0,
          totalSize: 0,
          reportTypes: [],
          lastUpload: null
        },
        reportTypes: reportTypeStats
      }
    });

  } catch (error) {
    console.error('File stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file statistics',
      error: error.message
    });
  }
});

module.exports = router;