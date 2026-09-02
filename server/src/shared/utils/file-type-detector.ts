/**
 * File type detection utility for invoice extraction
 */

export class FileTypeDetector {
  /**
   * Detect file type from file path/name
   * @param filePath - Path or filename
   * @returns 'pdf' | 'image' | 'unknown'
   */
  static detectFileType(filePath: string): 'pdf' | 'image' | 'unknown' {
    if (!filePath) {
      return 'unknown';
    }

    const fileName = filePath.toLowerCase();

    // PDF extensions
    if (fileName.endsWith('.pdf')) {
      return 'pdf';
    }

    // Image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];
    if (imageExtensions.some(ext => fileName.endsWith(ext))) {
      return 'image';
    }

    return 'unknown';
  }
}
