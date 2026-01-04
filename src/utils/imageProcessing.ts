export const loadTransparentSprite = (src: string): Promise<HTMLCanvasElement | HTMLImageElement> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(img);
                return;
            }

            ctx.drawImage(img, 0, 0);

            // Get pixel data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Detect background color from top-left pixel
            const r0 = data[0];
            const g0 = data[1];
            const b0 = data[2];
            const a0 = data[3];

            // If already transparent, return
            if (a0 === 0) {
                resolve(img);
                return;
            }

            // Tolerance to handle compression artifacts if any (though pixel art should be clean)
            const tolerance = 10;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // const a = data[i + 3];

                if (Math.abs(r - r0) <= tolerance &&
                    Math.abs(g - g0) <= tolerance &&
                    Math.abs(b - b0) <= tolerance) {
                    data[i + 3] = 0; // Set alpha to 0
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas);
        };
        img.onerror = (err) => {
            console.error(`Failed to load sprite: ${src}`, err);
            // Return empty canvas or null to prevent crash
            const empty = document.createElement('canvas');
            empty.width = 1;
            empty.height = 1;
            resolve(empty);
        };
    });
};
