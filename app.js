// State Management
const firebaseConfig = {
  apiKey: "AIzaSyCW1WZb7-Cn4yi6pfvaq10nfsQhLbAKL8Q",
  authDomain: "voka-f1aa5.firebaseapp.com",
  projectId: "voka-f1aa5",
  storageBucket: "voka-f1aa5.firebasestorage.app",
  messagingSenderId: "754859054128",
  appId: "1:754859054128:web:6817fd05ea722d73e9c9f5",
  measurementId: "G-MRC6LQE93X"
};

  firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const app = {
  activeView: 'home',

  quiz: {
    isActive: false,
    questions: [],
    currentIndex: 0,
    score: 0,
    hasAnswered: false,
    streak: 0
  },

  stats: {
    totalQuizzes: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    streak: 0
  },



  // Sample Words to populate initially or on demand
  sampleWords: [
    { id: 'sample-1', kanji: '先生', hiragana: 'せんせい', meaning: '선생님' },
    { id: 'sample-2', kanji: '学生', hiragana: 'がくせい', meaning: '학생' },
    { id: 'sample-3', kanji: '友達', hiragana: 'ともだち', meaning: '친구' },
    { id: 'sample-4', kanji: '美味しい', hiragana: 'おいしい', meaning: '맛있다' },
    { id: 'sample-5', kanji: '食べる', hiragana: 'たべる', meaning: '먹다' },
    { id: 'sample-6', kanji: '飲む', hiragana: 'のむ', meaning: '마시다' },
    { id: 'sample-7', kanji: '日本語', hiragana: 'にほんご', meaning: '일본어' },
    { id: 'sample-8', kanji: '学校', hiragana: 'がっこう', meaning: '학교' },
    { id: 'sample-9', kanji: '時間', hiragana: 'じかん', meaning: '시간' },
    { id: 'sample-10', kanji: '勉強', hiragana: 'べんきょう', meaning: '공부' },
    { id: 'sample-11', kanji: '可愛い', hiragana: 'かわいい', meaning: '귀엽다' },
    { id: 'sample-12', kanji: '面白い', hiragana: 'おもしろい', meaning: '재밌다' }
  ],

  // Initialization
    async init() {
        await this.loadData();
        this.navigate('home');
        this.updateStatsUI();
        lucide.createIcons();
    },

  // Load data from LocalStorage
  // loadData() {
  //   // Load words
  //   const savedWords = localStorage.getItem('nihongo_words');
  //   if (savedWords) {
  //     this.words = JSON.parse(savedWords);
  //   } else {
  //     // Auto-populate with sample words on very first visit
  //     this.words = [...this.sampleWords];
  //     this.saveData();
  //   }


  //   // Load stats
  //   const savedStats = localStorage.getItem('nihongo_stats');

  //   if (savedStats) {
  //     this.stats = JSON.parse(savedStats);
  //   }

  



  // Save words to LocalStorage
  saveData() {
    localStorage.setItem('nihongo_words', JSON.stringify(this.words));
  },

  async loadData() {
    this.words = [];

    const snapshot = await db.collection("words").get();

    snapshot.forEach((doc) => {
        this.words.push({
            id: doc.id,
            ...doc.data()
        });
    });

    // console.log("현재 단어 수:", this.words.length);

    // const savedStats = localStorage.getItem('nihongo_stats');

    // const statsDoc = await db.collection("stats")
    // .doc("global")
    // .get();
  
  // if (statsDoc.exists) {
  //   this.stats = statsDoc.data();
  // } else {
  //   this.stats = {
  //     totalQuizzes: 0,
  //     totalQuestions: 0,
  //     totalCorrect: 0,
  //     streak: 0
  //   };

  // }

  this.stats = {
    totalQuizzes: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    streak: 0
  };


    console.log("단어 개수:", this.words.length);
    console.log("단어 목록:", this.words);

    // if (savedStats) {
    //     this.stats = JSON.parse(savedStats);
    // }

    if (!this.stats) {
        this.stats = {
            totalQuizzes: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            streak: 0
        };
    }
},

  // Save stats to LocalStorage
  // saveStats() {
  //   localStorage.setItem('nihongo_stats', JSON.stringify(this.stats));
  // },

  async saveStats() {
    await db.collection("stats")
      .doc("global")
      .set(this.stats);
  },

  // SPA Navigation Control
  navigate(viewId) {
    this.activeView = viewId;

    // Remove active class from all views and buttons
    document.querySelectorAll('.app-view').forEach(view => {
      view.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    // Activate the selected view and nav button
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) targetView.classList.add('active');

    const targetNav = document.getElementById(`nav-${viewId}`);
    if (targetNav) targetNav.classList.add('active');

    // Trigger view-specific update actions
    if (viewId === 'home') {
      this.renderHomeRecentWords();
      this.updateStatsUI();
    } else if (viewId === 'list') {
      this.renderWordList(this.words);
      document.getElementById('search-input').value = '';
    } else if (viewId === 'quiz') {
      this.setupQuizRequirements();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Re-render Lucide Icons for dynamic content
    lucide.createIcons();
  },

  // Update Statistics UI
  updateStatsUI() {
    // Calculate accuracy
    const accuracy = this.stats.totalQuestions > 0 
      ? Math.round((this.stats.totalCorrect / this.stats.totalQuestions) * 100) 
      : 0;

    document.getElementById('stats-total-words').textContent = this.words.length;
    document.getElementById('stats-accuracy').textContent = `${accuracy}%`;
    document.getElementById('stats-streak').textContent = this.stats.streak;
  },

  // 1. HOME VIEW FUNCTIONS
  renderHomeRecentWords() {
    const container = document.getElementById('recent-words-container');
    container.innerHTML = '';

    if (this.words.length === 0) {
      container.innerHTML = '<p class="empty-text">등록된 단어가 없습니다. 새로운 단어를 추가해 보세요!</p>';
      return;
    }

    // Take the 4 most recently added words (last elements in array)
    const recentWords = [...this.words].reverse().slice(0, 4);

    recentWords.forEach(word => {
      const chip = document.createElement('div');
      chip.className = 'word-chip';
      
      const kanjiText = word.kanji ? `<span class="word-chip-kanji">${word.kanji}</span>` : '';
      
      chip.innerHTML = `
        <div class="word-chip-japanese">
          ${kanjiText}
          <span class="word-chip-hiragana">${word.hiragana}</span>
        </div>
        <span class="word-chip-meaning">${word.meaning}</span>
      `;
      container.appendChild(chip);
    });
  },

  // 2. INPUT VIEW FUNCTIONS
  handleWordSubmit(event) {
    event.preventDefault();

    const kanjiInput = document.getElementById('input-kanji');
    const hiraganaInput = document.getElementById('input-hiragana');
    const meaningInput = document.getElementById('input-meaning');

    const kanji = kanjiInput.value.trim();
    const hiragana = hiraganaInput.value.trim();
    const meaning = meaningInput.value.trim();

    if (!hiragana || !meaning) {
      alert('히라가나와 뜻은 필수 입력 항목입니다.');
      return;
    }

    // Create word object
    const newWord = {
      id: Date.now().toString(),
      kanji: kanji || null, // Kanji is optional
      hiragana,
      meaning
    };

    // Add to state and save
    // this.words.push(newWord);
    // this.saveData();

    // db.collection("words").add(newWord)
    //     .then((docRef) => {
    //         console.log("Firebase 저장 성공:", docRef.id);
    //     })
    //     .catch((err) => {
    //         console.error("Firebase 저장 실패:", err);
    //     });

    db.collection("words").add(newWord)
    // .then((docRef) => {
        // newWord.id = docRef.id;
        // this.words.push(newWord);

      .then(async (docRef) => {
        await this.loadData(); 

        this.renderHomeRecentWords();
        this.updateStatsUI();
    })
    .catch((err) => {
        console.error("Firebase 저장 실패:", err);
    });

    // Show Toast
    this.showToast('새로운 단어가 등록되었습니다!');

    // Reset Form fields
    this.resetForm();
  },

  resetForm() {
    document.getElementById('word-form').reset();
  },

  showToast(message) {
    const toast = document.getElementById('toast-message');
    toast.innerHTML = `<i data-lucide="check-circle" style="color: var(--color-success)"></i> ${message}`;
    lucide.createIcons();
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  },

  // Load sample data if vocabulary is empty or by request
  loadSampleData() {
    // Add words that aren't already duplicate (simple check by hiragana)
    let addedCount = 0;
    this.sampleWords.forEach(sample => {
      const exists = this.words.some(w => w.hiragana === sample.hiragana);
      if (!exists) {
        this.words.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          kanji: sample.kanji,
          hiragana: sample.hiragana,
          meaning: sample.meaning
        });
        addedCount++;
      }
    });

    this.saveData();
    this.setupQuizRequirements();
    this.showToast(`${addedCount}개의 기초 단어가 추가되었습니다!`);
  },

  // 3. QUIZ VIEW FUNCTIONS
  setupQuizRequirements() {
    const readyState = document.getElementById('quiz-ready-state');
    const activeState = document.getElementById('quiz-active-state');
    const wordCountBadge = document.getElementById('quiz-ready-word-count');
    const requirementsText = document.getElementById('quiz-requirements-text');
    const startBtn = document.getElementById('btn-start-quiz');

    readyState.classList.remove('hidden');
    activeState.classList.add('hidden');
    wordCountBadge.textContent = `등록된 단어: ${this.words.length}개`;

    if (this.words.length >= 4) {
      requirementsText.innerHTML = '퀴즈를 시작할 수 있습니다! 행운을 빕니다.';
      requirementsText.style.color = 'var(--text-secondary)';
      startBtn.disabled = false;
      startBtn.classList.remove('btn-secondary');
      startBtn.classList.add('btn-primary');
    } else {
      requirementsText.innerHTML = `<i data-lucide="alert-triangle" style="vertical-align: middle; margin-right: 4px; color: var(--color-accent)"></i> 퀴즈를 출제하려면 최소 4개 이상의 단어가 필요합니다.`;
      requirementsText.style.color = 'var(--color-accent)';
      startBtn.disabled = true;
      startBtn.classList.remove('btn-primary');
      startBtn.classList.add('btn-secondary');
    }
    lucide.createIcons();
  },

  startQuiz() {
    if (this.words.length < 4) return;

    // Reset quiz state
    this.quiz.isActive = true;
    this.quiz.currentIndex = 0;
    this.quiz.score = 0;
    this.quiz.hasAnswered = false;

    // Generate questions for this session
    // Max 10 questions, or total words if words list is smaller than 10
    const totalQuestions = Math.min(10, this.words.length);
    this.quiz.questions = this.generateQuizSession(totalQuestions);

    // Toggle view states
    document.getElementById('quiz-ready-state').classList.add('hidden');
    document.getElementById('quiz-active-state').classList.remove('hidden');

    this.renderQuestion();
  },

  generateQuizSession(count) {
    // Shuffle words copy to get random question candidates
    const shuffled = [...this.words].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, count);

    return selectedWords.map(correctWord => {
      // Determine what to ask and what to present as options
      // Fields: 'kanji', 'hiragana', 'meaning'
      const availableFields = ['hiragana', 'meaning'];
      if (correctWord.kanji) {
        availableFields.push('kanji');
      }

      // Pick prompt field
      const promptIndex = Math.floor(Math.random() * availableFields.length);
      const promptField = availableFields[promptIndex];

      // Pick answer field (must be different from prompt field)
      const remainingFields = availableFields.filter(f => f !== promptField);
      const answerIndex = Math.floor(Math.random() * remainingFields.length);
      const answerField = remainingFields[answerIndex];

      // Generate options (1 correct, 3 incorrect)
      const correctValue = correctWord[answerField];
      
      // Select incorrect values from other words
      const otherWords = this.words.filter(w => w.id !== correctWord.id);
      
      // Shuffle other words and grab their values for the answer field
      const incorrectOptions = [];
      const shuffledOthers = otherWords.sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < shuffledOthers.length; i++) {
        const value = shuffledOthers[i][answerField];
        // Ensure values are unique and non-empty
        if (value && value !== correctValue && !incorrectOptions.includes(value)) {
          incorrectOptions.push(value);
        }
        if (incorrectOptions.length === 3) break;
      }

      // Fallback in case we somehow didn't get 3 unique wrong options (should not happen if words.length >= 4)
      while (incorrectOptions.length < 3) {
        incorrectOptions.push(`오답 예시 ${incorrectOptions.length + 1}`);
      }

      // Combine and shuffle options
      const options = [correctValue, ...incorrectOptions].sort(() => 0.5 - Math.random());

      return {
        word: correctWord,
        promptField,
        answerField,
        questionText: correctWord[promptField],
        correctAnswer: correctValue,
        options: options
      };
    });
  },

  renderQuestion() {
    this.quiz.hasAnswered = false;
    const currentQ = this.quiz.questions[this.quiz.currentIndex];

    // Hide next button
    document.getElementById('btn-next-question').classList.add('hidden');

    // Update Progress UI
    const totalQ = this.quiz.questions.length;
    document.getElementById('quiz-question-number').textContent = `문제 #${this.quiz.currentIndex + 1} / ${totalQ}`;
    document.getElementById('quiz-score-display').textContent = `정답 개수: ${this.quiz.score} / ${this.quiz.currentIndex}`;
    
    const progressPercent = ((this.quiz.currentIndex) / totalQ) * 100;
    document.getElementById('quiz-progress-bar').style.width = `${progressPercent}%`;

    // Render Question Text
    const questionTextEl = document.getElementById('question-text-content');
    const questionSubtextEl = document.getElementById('question-subtext-content');
    const typeLabelEl = document.getElementById('question-type-label');

    // Question Label Based on Answer Type
    let label = '';
    if (currentQ.answerField === 'meaning') label = '알맞은 [뜻]을 고르세요';
    else if (currentQ.answerField === 'hiragana') label = '알맞은 [발음]을 고르세요';
    else if (currentQ.answerField === 'kanji') label = '알맞은 [한자]를 고르세요';
    typeLabelEl.textContent = label;

    questionTextEl.textContent = currentQ.questionText;

    // Subtext Helper
    let subtext = '';
    if (currentQ.promptField === 'kanji') subtext = '(한자)';
    else if (currentQ.promptField === 'hiragana') subtext = '(히라가나/가타카나)';
    else if (currentQ.promptField === 'meaning') subtext = '(뜻)';

    // If we prompt with Kanji and we have Hiragana/Meaning, we can show small hint to make it beautiful
    if (currentQ.promptField === 'kanji' && currentQ.answerField !== 'hiragana') {
      subtext = `(한자) - 발음: ${currentQ.word.hiragana}`;
    }
    questionSubtextEl.textContent = subtext;

    // Render Options
    const optionsContainer = document.getElementById('quiz-options-container');
    optionsContainer.innerHTML = '';

    currentQ.options.forEach((option, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `
        <span class="option-num">${idx + 1}</span>
        <span class="option-text">${option}</span>
      `;
      btn.onclick = () => this.checkAnswer(idx, btn);
      optionsContainer.appendChild(btn);
    });
  },

  checkAnswer(selectedIndex, selectedBtn) {
    if (this.quiz.hasAnswered) return;
    this.quiz.hasAnswered = true;

    const currentQ = this.quiz.questions[this.quiz.currentIndex];
    const isCorrect = currentQ.options[selectedIndex] === currentQ.correctAnswer;

    // Increment overall statistics
    this.stats.totalQuestions++;

    // Highlight selected button
    if (isCorrect) {
      selectedBtn.classList.add('correct');
      this.quiz.score++;
      this.stats.totalCorrect++;
      this.stats.streak++;
      this.quiz.streak++;
    } else {
      selectedBtn.classList.add('incorrect');
      this.stats.streak = 0;
      this.quiz.streak = 0;

      // Find and highlight correct answer
      const buttons = document.querySelectorAll('.option-btn');
      buttons.forEach(btn => {
        const text = btn.querySelector('.option-text').textContent;
        if (text === currentQ.correctAnswer) {
          btn.classList.add('correct');
        }
      });
    }

    // Disable all options
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.disabled = true;
    });

    // Save statistics
    this.saveStats();

    // Reveal Next Question Button
    const nextBtn = document.getElementById('btn-next-question');
    nextBtn.classList.remove('hidden');
    
    // Auto scroll down to focus next button on mobile
    nextBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  nextQuestion() {
    this.quiz.currentIndex++;

    if (this.quiz.currentIndex >= this.quiz.questions.length) {
      // Quiz finished
      this.showQuizResult();
    } else {
      this.renderQuestion();
    }
  },

  showQuizResult() {
    const totalQ = this.quiz.questions.length;
    const score = this.quiz.score;
    const accuracy = Math.round((score / totalQ) * 100);

    // Update Progress Bar to 100%
    document.getElementById('quiz-progress-bar').style.width = '100%';
    document.getElementById('quiz-score-display').textContent = `정답 개수: ${score} / ${totalQ}`;

    // Replace Quiz Active View elements with a beautiful result card
    const activeStateContainer = document.getElementById('quiz-active-state');
    
    let iconName = 'trophy';
    let message = '훌륭합니다! 완벽해요!';
    let messageClass = 'text-gold';
    
    if (accuracy === 100) {
      iconName = 'crown';
      message = '대단합니다! 모든 문제를 맞췄어요!';
    } else if (accuracy >= 70) {
      iconName = 'award';
      message = '참 잘하셨습니다! 조금만 더 하면 완벽해요!';
    } else if (accuracy >= 40) {
      iconName = 'thumbs-up';
      message = '좋은 노력입니다. 복습 후 다시 도전해 보세요!';
    } else {
      iconName = 'alert-circle';
      message = '단어장에서 단어들을 더 복습한 후에 다시 풀어보세요!';
    }

    activeStateContainer.innerHTML = `
      <div class="card-panel text-center quiz-intro-panel" style="animation: fadeIn 0.4s ease-out;">
        <i data-lucide="${iconName}" class="intro-icon" style="color: var(--color-primary)"></i>
        <h2>퀴즈 결과</h2>
        <h3 style="margin-top: 10px; color: var(--color-primary);">${message}</h3>
        
        <div class="quiz-requirements" style="margin-top: 24px;">
          <div style="font-size: 48px; font-weight: 800; color: #fff;">${score} <span style="font-size: 20px; color: var(--text-secondary);">/ ${totalQ}</span></div>
          <p style="font-size: 16px; font-weight: 600; color: var(--color-primary);">정답률: ${accuracy}%</p>
        </div>

        <div class="intro-actions" style="margin-top: 24px;">
          <button class="btn btn-primary btn-lg" onclick="app.restartQuizAfterFinished()">
            다시 도전하기 <i data-lucide="refresh-cw"></i>
          </button>
          <button class="btn btn-secondary btn-lg" onclick="app.navigate('home')">
            홈으로 이동 <i data-lucide="home"></i>
          </button>
        </div>
      </div>
    `;
    
    lucide.createIcons();
  },

  restartQuizAfterFinished() {
    // Restore original active state layout
    const activeStateContainer = document.getElementById('quiz-active-state');
    activeStateContainer.innerHTML = `
      <div class="quiz-header-bar">
        <div class="quiz-progress-info">
          <span id="quiz-question-number">문제 #1</span>
          <span id="quiz-score-display">맞춘 개수: 0/0</span>
        </div>
        <div class="quiz-progress-track">
          <div class="quiz-progress-fill" id="quiz-progress-bar" style="width: 0%"></div>
        </div>
      </div>

      <div class="question-card">
        <div class="question-type-badge" id="question-type-label">뜻을 맞추세요</div>
        <div class="question-text" id="question-text-content">漢字</div>
        <div class="question-subtext" id="question-subtext-content">(한자)</div>
      </div>

      <div class="options-grid" id="quiz-options-container"></div>

      <div class="quiz-footer-actions">
        <button id="btn-next-question" class="btn btn-primary btn-next hidden" onclick="app.nextQuestion()">
          다음 문제 <i data-lucide="arrow-right"></i>
        </button>
        <button class="btn btn-secondary-outline" onclick="app.exitQuiz()">
          퀴즈 중단 <i data-lucide="log-out"></i>
        </button>
      </div>
    `;

    this.startQuiz();
  },

  exitQuiz() {
    if (confirm('진행 중인 퀴즈를 중단하고 홈으로 이동하시겠습니까?')) {
      this.quiz.isActive = false;
      this.navigate('home');
    }
  },

  // 4. WORD LIST VIEW FUNCTIONS
  renderWordList(wordsToRender) {
    const container = document.getElementById('words-list-container');
    const emptyState = document.getElementById('list-empty-state');
    const totalCountBadge = document.getElementById('list-total-count');

    container.innerHTML = '';
    totalCountBadge.textContent = `총 ${wordsToRender.length}개의 단어`;

    if (wordsToRender.length === 0) {
      container.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    container.classList.remove('hidden');
    emptyState.classList.add('hidden');

    wordsToRender.forEach(word => {
      const card = document.createElement('div');
      card.className = 'word-card';
      
      const kanjiText = word.kanji ? `<span class="word-kanji">${word.kanji}</span>` : '';
      
      card.innerHTML = `
        <div class="word-card-content">
          <div class="word-japanese">
            ${kanjiText}
            <span class="word-hiragana">${word.hiragana}</span>
          </div>
          <span class="word-meaning">${word.meaning}</span>
        </div>
        <div class="word-card-actions">
          <button class="btn-delete" onclick="app.deleteWord('${word.id}')" title="단어 삭제">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    lucide.createIcons();
  },

  // deleteWord(id) {
  //   if (confirm('이 단어를 정말 삭제하시겠습니까?')) {
  //     this.words = this.words.filter(word => word.id !== id);
  //     this.saveData();
      
  //     // Re-filter/re-render based on current search input
  //     this.filterWords();
  //     this.showToast('단어가 삭제되었습니다.');
  //   }
  // },

  // deleteWord(id) {
  //   alert("삭제 눌림: " + id);

  //   if (confirm('이 단어를 정말 삭제하시겠습니까?')) {
  
  //     db.collection("words").doc(id).delete()
  //       .then(() => {
  
  //         this.words = this.words.filter(word => word.id !== id);
  
  //         this.filterWords();
  //         this.updateStatsUI();
  //         this.showToast('단어가 삭제되었습니다.');
  
  //       })
  //       .catch((err) => {
  //         console.error("삭제 실패:", err);
  //         alert("삭제에 실패했습니다.");
  //       });
  
  //   }
  // },

  deleteWord(id) {
    console.log("삭제 요청 id:", id);
  
    if (confirm('이 단어를 정말 삭제하시겠습니까?')) {
  
      db.collection("words")
        .where("id", "==", id)
        .get()
        .then(snapshot => {
  
          snapshot.forEach(doc => {
            doc.ref.delete();
          });
  
          // 로컬도 바로 반영
          this.words = this.words.filter(word => word.id !== id);
  
          this.filterWords();
          this.updateStatsUI();
          this.showToast('단어가 삭제되었습니다.');
        })
        .catch((err) => {
          console.error("삭제 실패:", err);
          alert("삭제에 실패했습니다.");
        });
  
    }
  },

  
  

  // clearAllWordsWithConfirm() {
  //   if (this.words.length === 0) {
  //     alert('삭제할 단어가 없습니다.');
  //     return;
  //   }
    
  //   if (confirm('등록된 모든 단어를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
  //     this.words = [];
  //     this.saveData();
  //     this.filterWords();
  //     this.showToast('모든 단어가 삭제되었습니다.');
  //   }
  // },

  async clearAllWordsWithConfirm() {
    if (this.words.length === 0) {
      alert('삭제할 단어가 없습니다.');
      return;
    }
  
    if (confirm('등록된 모든 단어를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
  
      const snapshot = await db.collection("words").get();
  
      const promises = [];
  
      snapshot.forEach(doc => {
        promises.push(doc.ref.delete());
      });
  
      await Promise.all(promises);
  
      this.words = [];
      this.filterWords();
      this.updateStatsUI();
      this.showToast('모든 단어가 삭제되었습니다.');
    }
  },


  filterWords() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (!query) {
      this.renderWordList(this.words);
      return;
    }

    const filtered = this.words.filter(word => {
      const kanjiMatch = word.kanji ? word.kanji.toLowerCase().includes(query) : false;
      const hiraganaMatch = word.hiragana.toLowerCase().includes(query);
      const meaningMatch = word.meaning.toLowerCase().includes(query);
      
      return kanjiMatch || hiraganaMatch || meaningMatch;
    });

    this.renderWordList(filtered);
  }
};

// const app = window.app;
window.app = app;

// Start the app when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});