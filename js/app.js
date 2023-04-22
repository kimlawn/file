const firebaseConfig = {
  apiKey: "AIzaSyABpvKxndo3pTqz2M9KRMmLT04QRE4fTcc",
  authDomain: "updown-e4a97.firebaseapp.com",
  projectId: "updown-e4a97",
  storageBucket: "updown-e4a97.appspot.com",
  messagingSenderId: "187528912548",
  appId: "1:187528912548:web:a9885e744fd65b821b9031",
  measurementId: "G-5BEK63C65L"
};
firebase.initializeApp(firebaseConfig);

const storage = firebase.storage();
const storageRef = storage.ref();

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileListUl = document.getElementById('fileListUl');
const downloadButton = document.getElementById('downloadButton');
const uploadButton = document.getElementById('uploadButton');
const uploadProgress = document.getElementById('uploadProgress');
const deleteButton = document.getElementById('deleteButton');

let filesToUpload = [];
let selectedFilesToDownload = new Set();
let selectedFile = null;
let selectedFilename = null;

uploadButton.disabled = true;

// 드래그 앤 드롭 이벤트 설정
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy';
});


uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer.files.length > 0) {
    filesToUpload = filesToUpload.concat(Array.from(e.dataTransfer.files));
    updateSelectedFilesText();
    uploadButton.disabled = false;
  }
});


// 드래그 앤 드롭 영역 클릭 이벤트 설정
uploadArea.addEventListener('click', () => {
  fileInput.click();
});


fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    filesToUpload = filesToUpload.concat(Array.from(fileInput.files));
    updateSelectedFilesText();
    uploadButton.disabled = false;
  }
});

// 파일 목록 텍스트 업데이트 함수
function updateSelectedFilesText() {
  document.getElementById('fileName').innerText = `아래 파일이 추가됩니다.\n\n${filesToUpload.map((file, idx) => `${idx + 1}. ${file.name}`).join('\n')}`;
}


// 파일 업로드 버튼 클릭 이벤트
uploadButton.addEventListener('click', async () => {
  if (filesToUpload.length > 0) {
    for (const file of filesToUpload) {
      await uploadFile(file);
    }
    filesToUpload = [];
    updateSelectedFilesText();
    location.reload();
  }
});


// 파일 업로드 핸들러
async function uploadFile(file) {
  const fileRef = storageRef.child(file.name);
  const uploadTask = fileRef.put(file);

  // 업로드 중인 파일 이름 표시
  uploadingFileName.textContent = `업로드 중인 파일: ${file.name}`;
  uploadProgress.style.display = 'block';

  await new Promise((resolve, reject) => {
    uploadTask.on('state_changed', (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      uploadProgress.value = progress;

    }, (error) => {
      // 업로드 중 오류 처리
      console.error('업로드 중 오류:', error);
      uploadProgress.style.display = 'none';
      reject(error);
    }, () => {
      // 업로드 완료 후 처리
      console.log('업로드 완료:', file.name);
      uploadProgress.style.display = 'none';
      resolve();
    });
  });

  // 업로드가 완료되면 파일 이름 표시를 초기화합니다.
  uploadingFileName.textContent = '';
}




// 파일 목록 불러오기
function listFiles() {
  storageRef.listAll().then((res) => {
    fileListUl.innerHTML = '';
    res.items.forEach((itemRef) => {
      itemRef.getDownloadURL().then((url) => {
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            selectedFilesToDownload.add(itemRef);
          } else {
            selectedFilesToDownload.delete(itemRef);
          }
          downloadButton.disabled = deleteButton.disabled = selectedFilesToDownload.size === 0;
        });

        li.appendChild(checkbox);
        const fileNameSpan = document.createElement('span');
        fileNameSpan.textContent = itemRef.name;
        fileNameSpan.dataset.url = url;

        li.appendChild(fileNameSpan);
        fileListUl.appendChild(li);
      });
    });
  });
}

// 파일 삭제 핸들러
function deleteFiles() {
  const promises = Array.from(selectedFilesToDownload).map((fileRef) => {
    return fileRef.delete().then(() => {
      console.log('파일 삭제 완료:', fileRef.name);
    }).catch((error) => {
      console.error('파일 삭제 오류:', error);
    });
  });

  Promise.all(promises).then(() => {
    listFiles();
    selectedFilesToDownload.clear(); // 추가: 선택된 파일을 비워줍니다.
    downloadButton.disabled = deleteButton.disabled = true; // 추가: 다운로드 버튼과 삭제 버튼을 비활성화 합니다.
  });
}

deleteButton.addEventListener('click', deleteFiles);



// 파일 다운로드 버튼 클릭 이벤트
downloadButton.addEventListener('click', async () => {
  if (selectedFilesToDownload.size > 0) {
    if (selectedFilesToDownload.size > 1) {
      const zip = new JSZip();

      const downloadPromises = Array.from(selectedFilesToDownload).map(async (itemRef) => {
        const url = await itemRef.getDownloadURL();
        const response = await fetch(url, { mode: 'no-cors' });
        const blob = await response.blob();
        zip.file(itemRef.name, blob, { binary: true });
      });

      await Promise.all(downloadPromises);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipLink = document.createElement('a');
      zipLink.href = URL.createObjectURL(zipBlob);
      zipLink.download = 'files.zip';
      zipLink.style.display = 'none';
      document.body.appendChild(zipLink);
      zipLink.click();
      document.body.removeChild(zipLink);
    } else {
      const itemRef = Array.from(selectedFilesToDownload)[0];
      const url = await itemRef.getDownloadURL();
      const link = document.createElement('a');
      link.href = url;
      link.download = itemRef.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } else {
    alert('다운로드할 파일을 선택해주세요.');
  }
});



listFiles();
