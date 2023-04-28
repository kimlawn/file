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

  // Firestore 초기화
  const db = firebase.firestore();

  // HTML 요소 선택
  const memoText = document.getElementById('memo-text');
  const sendMemoBtn = document.getElementById('send-memo');
  const deleteMemoBtn = document.getElementById('delete-memo');
  const memosDisplay = document.getElementById('memos-display');
  const deleteAllMemosBtn = document.getElementById('delete-all-memos');

  // 메모 전송 함수
  function sendMemo() {
      const memo = memoText.value;
      const createdAt = new Date();

      db.collection('memos').add({
          content: memo,
          createdAt: createdAt
      }).then(() => {
          memoText.value = '';
          loadMemosRealtime();
      });
  }

  // 메모 삭제 함수
  function deleteMemo(memoId) {
      db.collection('memos').doc(memoId).delete().then(() => {
          loadMemosRealtime();
      });
  }

  // 전체 메모 삭제 함수
  function deleteAllMemos() {
    db.collection('memos').get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        db.collection('memos').doc(doc.id).delete();
      });
      loadMemosRealtime();
    });
  }

  // 작성 시간 포맷 함수
  function formatTime(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }


  // 실시간 메모 불러오기 함수
  function loadMemosRealtime() {
      db.collection('memos').orderBy('createdAt', 'desc')
      .onSnapshot((querySnapshot) => {
          memosDisplay.innerHTML = '';
          querySnapshot.forEach((doc) => {
              const memoData = doc.data();
              const memoId = doc.id;
              const memoDiv = document.createElement('div');
              memoDiv.className = 'memo';
              const formattedTime = formatTime(memoData.createdAt.toDate());

              memoDiv.innerHTML = `
                  <p>${memoData.content.replace(/\n/g, '<br>')}</p>
                  <p>작성 시간: ${formattedTime}</p>
                  <button onclick="deleteMemo('${memoId}')">삭제</button>
              `;

              memosDisplay.appendChild(memoDiv);
          });
      });
  }

  // 이벤트 리스너 등록
  sendMemoBtn.addEventListener('click', sendMemo);
  deleteAllMemosBtn.addEventListener('click', deleteAllMemos);

  // 저장된 메모 초기 로딩
  loadMemosRealtime();
