function load(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Imagem inválida.'));
    };
    img.src = url;
  });
}

// Corte quadrado ao centro, como no protótipo; baixa a qualidade até caber no limite
function square(img, size, max) {
  const side = Math.min(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
  for (const quality of [0.8, 0.65, 0.5, 0.35]) {
    const data = canvas.toDataURL('image/jpeg', quality);
    if (data.length <= max) return data;
  }
  throw new Error('A imagem é demasiado grande. Escolhe outra.');
}

export async function resizeImage(file, size = 256) {
  return square(await load(file), size, Infinity);
}

function fit(img, side, max) {
  const scale = Math.min(1, side / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    const data = canvas.toDataURL('image/jpeg', quality);
    if (data.length <= max) return data;
  }
  return null;
}

export async function resizePhoto(file) {
  const img = await load(file);
  const data = fit(img, 1280, 380000) || fit(img, 900, 380000);
  if (!data) throw new Error('A imagem é demasiado grande. Escolhe outra.');
  return { data, thumb: square(img, 312, 60000) };
}
