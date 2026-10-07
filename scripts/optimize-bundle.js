#!/usr/bin/env node

// Bundle optimization script for Pharma-Scan app
const fs = require('fs');
const path = require('path');

// Bundle optimization configurations
const OPTIMIZATION_CONFIG = {
  // Images to optimize
  imageOptimization: {
    enabled: true,
    formats: ['webp', 'avif'],
    quality: 85,
    progressive: true,
  },
  
  // Code splitting
  codeSplitting: {
    enabled: true,
    chunks: {
      vendor: ['react', 'react-native', '@expo/vector-icons'],
      navigation: ['@react-navigation'],
      api: ['@tanstack/react-query'],
      utils: ['lodash', 'date-fns'],
    },
  },
  
  // Tree shaking
  treeShaking: {
    enabled: true,
    sideEffects: false,
  },
  
  // Compression
  compression: {
    enabled: true,
    algorithm: 'gzip',
    level: 6,
  },
};

// Analyze bundle size
function analyzeBundleSize() {
  console.log('🔍 Analyzing bundle size...\n');
  
  try {
    const buildDir = path.join(__dirname, '../static-build');
    if (!fs.existsSync(buildDir)) {
      console.log('❌ Build directory not found. Run "npm run expo:static:build" first.');
      return;
    }

    const files = getDirectoryFiles(buildDir);
    const analysis = analyzeFiles(files);
    
    console.log('📊 Bundle Size Analysis:');
    console.log('==================');
    
    // Total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    console.log(`Total Bundle Size: ${formatFileSize(totalSize)}`);
    
    // Largest files
    console.log('\n📁 Largest Files:');
    files
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach(file => {
        console.log(`  ${file.path}: ${formatFileSize(file.size)}`);
      });
    
    // File type distribution
    const typeDistribution = analyzeFileTypeDistribution(files);
    console.log('\n📋 File Type Distribution:');
    Object.entries(typeDistribution).forEach(([type, size]) => {
      console.log(`  ${type}: ${formatFileSize(size)} (${((size / totalSize) * 100).toFixed(1)}%)`);
    });
    
    // Optimization recommendations
    console.log('\n💡 Optimization Recommendations:');
    const recommendations = generateRecommendations(analysis);
    recommendations.forEach(rec => console.log(`  • ${rec}`));
    
  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
  }
}

// Get all files in directory recursively
function getDirectoryFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      getDirectoryFiles(fullPath, files);
    } else {
      files.push({
        path: path.relative(path.join(__dirname, '../static-build'), fullPath),
        size: stat.size,
        type: path.extname(item).slice(1) || 'unknown',
      });
    }
  }
  
  return files;
}

// Analyze files
function analyzeFiles(files) {
  return {
    totalFiles: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    largestFiles: files.sort((a, b) => b.size - a.size).slice(0, 10),
    fileTypes: analyzeFileTypeDistribution(files),
  };
}

// Analyze file type distribution
function analyzeFileTypeDistribution(files) {
  const distribution = {};
  
  files.forEach(file => {
    const type = file.type.toLowerCase();
    distribution[type] = (distribution[type] || 0) + file.size;
  });
  
  return distribution;
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Generate optimization recommendations
function generateRecommendations(analysis) {
  const recommendations = [];
  
  // Large files recommendations
  analysis.largestFiles.forEach(file => {
    if (file.size > 1024 * 1024) { // > 1MB
      recommendations.push(`Consider splitting ${file.path} (${formatFileSize(file.size)})`);
    }
  });
  
  // Image optimization
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const totalImageSize = Object.entries(analysis.fileTypes)
    .filter(([type]) => imageTypes.includes(type))
    .reduce((sum, [, size]) => sum + size, 0);
  
  if (totalImageSize > 1024 * 1024) { // > 1MB
    recommendations.push(`Optimize images (${formatFileSize(totalImageSize)}) - use WebP/AVIF format`);
  }
  
  // JavaScript optimization
  const jsSize = analysis.fileTypes.js || 0;
  if (jsSize > 2 * 1024 * 1024) { // > 2MB
    recommendations.push(`Enable code splitting for JavaScript (${formatFileSize(jsSize)})`);
  }
  
  // General recommendations
  if (analysis.totalSize > 5 * 1024 * 1024) { // > 5MB
    recommendations.push('Bundle size is large - consider lazy loading');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Bundle size looks good! 🎉');
  }
  
  return recommendations;
}

// Optimize images
function optimizeImages() {
  console.log('🖼️  Optimizing images...\n');
  
  const assetsDir = path.join(__dirname, '../assets');
  if (!fs.existsSync(assetsDir)) {
    console.log('❌ Assets directory not found');
    return;
  }
  
  const imageFiles = getImageFiles(assetsDir);
  
  if (imageFiles.length === 0) {
    console.log('📸 No images found to optimize');
    return;
  }
  
  console.log(`Found ${imageFiles.length} images to optimize`);
  
  // This would integrate with your image optimization service
  imageFiles.forEach(file => {
    console.log(`  📷 ${path.basename(file)} - would be optimized to WebP`);
  });
  
  console.log('\n💡 Image optimization tips:');
  console.log('  • Use WebP format for better compression');
  console.log('  • Implement lazy loading for images');
  console.log('  • Use responsive images with srcset');
  console.log('  • Compress images to 80-85% quality');
}

// Get image files
function getImageFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      getImageFiles(fullPath, files);
    } else {
      const ext = path.extname(item).toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

// Generate bundle optimization report
function generateOptimizationReport() {
  console.log('📋 Generating Bundle Optimization Report...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    bundleSize: {},
    optimizations: OPTIMIZATION_CONFIG,
    recommendations: [],
  };
  
  // Save report
  const reportPath = path.join(__dirname, '../bundle-optimization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Report saved to: ${reportPath}`);
}

// Main execution
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'analyze':
      analyzeBundleSize();
      break;
    case 'images':
      optimizeImages();
      break;
    case 'report':
      generateOptimizationReport();
      break;
    default:
      console.log('🚀 Pharma-Scan Bundle Optimizer');
      console.log('================================');
      console.log('\nUsage:');
      console.log('  node scripts/optimize-bundle.js analyze  - Analyze bundle size');
      console.log('  node scripts/optimize-bundle.js images   - Optimize images');
      console.log('  node scripts/optimize-bundle.js report   - Generate optimization report');
      console.log('\nAvailable commands:');
      console.log('  analyze  - Analyze current bundle size and structure');
      console.log('  images   - Optimize images for better compression');
      console.log('  report   - Generate comprehensive optimization report');
      break;
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundleSize,
  optimizeImages,
  generateOptimizationReport,
};
