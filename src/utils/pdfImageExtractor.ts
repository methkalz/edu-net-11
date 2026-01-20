import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - Vite compatible
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export interface ExtractedImage {
  pageNumber: number;
  imageIndex: number;
  base64: string;
  width: number;
  height: number;
}

/**
 * Extract embedded images from a PDF file
 * Uses PDF.js to parse the PDF and extract image XObjects
 */
export async function extractImagesFromPDF(file: File): Promise<ExtractedImage[]> {
  console.log('Starting PDF image extraction...');
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: ExtractedImage[] = [];
    
    console.log(`PDF loaded: ${pdf.numPages} pages`);
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const operatorList = await page.getOperatorList();
        
        let imageIndexOnPage = 0;
        
        for (let i = 0; i < operatorList.fnArray.length; i++) {
          // Check for image paint operations
          if (operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
              operatorList.fnArray[i] === pdfjsLib.OPS.paintXObject) {
            
            try {
              const imgName = operatorList.argsArray[i][0];
              
              // Get image object from page resources
              const imgObj = await new Promise<any>((resolve, reject) => {
                page.objs.get(imgName, (obj: any) => {
                  if (obj) {
                    resolve(obj);
                  } else {
                    reject(new Error(`Image object ${imgName} not found`));
                  }
                });
              });
              
              if (imgObj && imgObj.data && imgObj.width && imgObj.height) {
                // Create canvas to convert image data to base64
                const canvas = document.createElement('canvas');
                canvas.width = imgObj.width;
                canvas.height = imgObj.height;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                  // Handle different image data formats
                  let imageData: ImageData;
                  
                  if (imgObj.data instanceof Uint8ClampedArray) {
                    // RGBA data
                    if (imgObj.data.length === imgObj.width * imgObj.height * 4) {
                      imageData = new ImageData(imgObj.data, imgObj.width, imgObj.height);
                    } 
                    // RGB data - convert to RGBA
                    else if (imgObj.data.length === imgObj.width * imgObj.height * 3) {
                      const rgbaData = new Uint8ClampedArray(imgObj.width * imgObj.height * 4);
                      for (let j = 0; j < imgObj.width * imgObj.height; j++) {
                        rgbaData[j * 4] = imgObj.data[j * 3];
                        rgbaData[j * 4 + 1] = imgObj.data[j * 3 + 1];
                        rgbaData[j * 4 + 2] = imgObj.data[j * 3 + 2];
                        rgbaData[j * 4 + 3] = 255;
                      }
                      imageData = new ImageData(rgbaData, imgObj.width, imgObj.height);
                    } else {
                      console.warn(`Unexpected image data length on page ${pageNum}, image ${imageIndexOnPage}`);
                      continue;
                    }
                  } else if (imgObj.data instanceof Uint8Array) {
                    // Convert Uint8Array to Uint8ClampedArray
                    const clampedData = new Uint8ClampedArray(imgObj.data);
                    if (clampedData.length === imgObj.width * imgObj.height * 4) {
                      imageData = new ImageData(clampedData, imgObj.width, imgObj.height);
                    } else if (clampedData.length === imgObj.width * imgObj.height * 3) {
                      const rgbaData = new Uint8ClampedArray(imgObj.width * imgObj.height * 4);
                      for (let j = 0; j < imgObj.width * imgObj.height; j++) {
                        rgbaData[j * 4] = clampedData[j * 3];
                        rgbaData[j * 4 + 1] = clampedData[j * 3 + 1];
                        rgbaData[j * 4 + 2] = clampedData[j * 3 + 2];
                        rgbaData[j * 4 + 3] = 255;
                      }
                      imageData = new ImageData(rgbaData, imgObj.width, imgObj.height);
                    } else {
                      console.warn(`Unexpected image data length on page ${pageNum}, image ${imageIndexOnPage}`);
                      continue;
                    }
                  } else {
                    console.warn(`Unknown image data type on page ${pageNum}, image ${imageIndexOnPage}`);
                    continue;
                  }
                  
                  ctx.putImageData(imageData, 0, 0);
                  
                  // Convert to PNG base64
                  const base64 = canvas.toDataURL('image/png');
                  
                  // Filter out very small images (likely icons or artifacts)
                  if (imgObj.width >= 50 && imgObj.height >= 50) {
                    images.push({
                      pageNumber: pageNum,
                      imageIndex: imageIndexOnPage,
                      base64,
                      width: imgObj.width,
                      height: imgObj.height
                    });
                    
                    console.log(`Extracted image: page ${pageNum}, index ${imageIndexOnPage}, size ${imgObj.width}x${imgObj.height}`);
                  }
                  
                  imageIndexOnPage++;
                }
              }
            } catch (imgError) {
              console.warn(`Failed to extract image on page ${pageNum}:`, imgError);
              // Continue to next image
            }
          }
        }
      } catch (pageError) {
        console.warn(`Failed to process page ${pageNum}:`, pageError);
        // Continue to next page
      }
    }
    
    console.log(`PDF image extraction complete: ${images.length} images extracted`);
    return images;
    
  } catch (error) {
    console.error('PDF image extraction failed:', error);
    return [];
  }
}
