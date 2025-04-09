function composite(bgImg, fgImg, fgOpac, fgPos) {
    // Prendiamo i pixel delle immagini (sono numeri messi tutti in fila)
    let bgData = bgImg.data;
    let fgData = fgImg.data;

    // Prendiamo la larghezza e altezza delle immagini
    let bgWidth = bgImg.width;
    let bgHeight = bgImg.height;
    let fgWidth = fgImg.width;
    let fgHeight = fgImg.height;

    // Per ogni pixel del foreground (immagine davanti)
    for (let y = 0; y < fgHeight; y++) {
        for (let x = 0; x < fgWidth; x++) {

            // Calcoliamo dove va messo quel pixel sull'immagine di sfondo
            let bgX = fgPos.x + x;
            let bgY = fgPos.y + y;

            // Se il pixel va fuori dallo sfondo, lo saltiamo
            if (bgX < 0 || bgX >= bgWidth || bgY < 0 || bgY >= bgHeight) {
                continue;
            }

            // Ogni pixel ha 4 numeri: rosso, verde, blu e trasparenza (RGBA)
            // Calcoliamo dove si trovano quei 4 numeri nella lista
            let fgIndex = (y * fgWidth + x) * 4;
            let bgIndex = (bgY * bgWidth + bgX) * 4;

            // Prendiamo i colori e la trasparenza del pixel davanti
            let fgR = fgData[fgIndex];
            let fgG = fgData[fgIndex + 1];
            let fgB = fgData[fgIndex + 2];
            let fgAlpha = fgData[fgIndex + 3] / 255; // la trasparenza va da 0 a 1
            let fgA = fgAlpha * fgOpac; // la rendiamo ancora più trasparente se serve

            // Se il pixel davanti è completamente trasparente, lo saltiamo
            if (fgA === 0) {
                continue;
            }

            // Prendiamo i colori e la trasparenza del pixel dietro
            let bgR = bgData[bgIndex];
            let bgG = bgData[bgIndex + 1];
            let bgB = bgData[bgIndex + 2];
            let bgA = bgData[bgIndex + 3] / 255;

            // Calcoliamo quanta trasparenza ci sarà nel risultato
            let outA = fgA + bgA * (1 - fgA);

            // Se c’è un po’ di pixel da vedere (cioè outA > 0), mischiamo i colori
            if (outA > 0) {
                bgData[bgIndex]     = (fgR * fgA + bgR * bgA * (1 - fgA)) / outA;
                bgData[bgIndex + 1] = (fgG * fgA + bgG * bgA * (1 - fgA)) / outA;
                bgData[bgIndex + 2] = (fgB * fgA + bgB * bgA * (1 - fgA)) / outA;
                bgData[bgIndex + 3] = outA * 255; // rimettiamo la trasparenza in formato da 0 a 255
            }
        }
    }
}
