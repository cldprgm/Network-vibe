import imageCompression from 'browser-image-compression';

const defaultOptions = {
    maxWidthOrHeight: 2560,
    initialQuality: 0.6,
    useWebWorker: true,
    fileType: "image/webp",
    maxIteration: 2,
};

const COMPRESSION_TIMEOUT_MS = 3500;

export async function processAndAppendFiles(
    files: File[],
    formData: FormData,
    setStatus: (status: string) => void
): Promise<void> {

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileToUpload = file;
        const counterText = `${i + 1}/${files.length}`;

        const isImage = file.type.startsWith('image/');
        const isGif = file.type === 'image/gif';
        const isVideo = file.type.startsWith('video/');
        const needsCompression = isImage && !isGif;

        if (needsCompression) {
            setStatus(`Compressing image (${counterText})...`);
        } else if (isGif) {
            setStatus(`Preparing GIF (${counterText})...`);
            await new Promise(r => setTimeout(r, 50));
        } else if (isVideo) {
            setStatus(`Preparing video (${counterText})...`);
            await new Promise(r => setTimeout(r, 50));
        } else {
            setStatus(`Processing file (${counterText})...`);
        }

        if (needsCompression) {
            try {
                const compressionPromise = imageCompression(file, defaultOptions);

                const timeoutPromise = new Promise<null>((resolve) =>
                    setTimeout(() => resolve(null), COMPRESSION_TIMEOUT_MS)
                );

                const compressedBlob = await Promise.race([compressionPromise, timeoutPromise]);

                if (compressedBlob) {
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                    fileToUpload = new File([compressedBlob], newName, {
                        type: "image/webp",
                        lastModified: Date.now()
                    });
                }
            } catch (error) {
                console.error(`Compression failed for ${file.name}, using original.`, error);
            }
        }

        formData.append('media_files', fileToUpload, fileToUpload.name);
    }
}