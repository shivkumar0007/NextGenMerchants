const CLOUD_NAME = "dqhovacnx";
const UPLOAD_PRESET = "shopx ai";

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

const normalizeCloudinaryError = async (response) => {
  try {
    const data = await response.json();
    return data?.error?.message || "Cloudinary upload failed.";
  } catch (error) {
    return "Cloudinary upload failed.";
  }
};

export const uploadFileToCloudinary = async (file, folder, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", CLOUDINARY_UPLOAD_URL);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const progress = Math.round((event.loaded / event.total) * 100);
      onProgress?.(progress);
    };

    xhr.onerror = () => {
      reject(new Error("Cloudinary upload failed. Check internet connection."));
    };

    xhr.onload = async () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        const message = await normalizeCloudinaryError({
          json: async () => JSON.parse(xhr.responseText || "{}"),
        });
        reject(new Error(message));
        return;
      }

      const data = JSON.parse(xhr.responseText || "{}");
      onProgress?.(100);
      resolve(data.secure_url);
    };

    xhr.send(formData);
  });
};

export const uploadMultipleFilesToCloudinary = async (files, folder, onProgress) => {
  const list = Array.from(files);
  const urls = [];

  for (let index = 0; index < list.length; index += 1) {
    const file = list[index];
    const url = await uploadFileToCloudinary(file, folder, (fileProgress) => {
      const overallProgress = Math.round(((index + fileProgress / 100) / list.length) * 100);
      onProgress?.(overallProgress);
    });
    urls.push(url);
  }

  onProgress?.(100);
  return urls;
};
