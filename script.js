/**
 * ==========================================================================
 * TASKFLOW — SMART TODO & VOICE ASSISTANT
 * Production-Quality Vanilla JavaScript Engine
 * ==========================================================================
 */

'use strict';

(function () {
  // --------------------------------------------------------------------------
  // 1. Initial State & Storage Keys
  // --------------------------------------------------------------------------
  const STORAGE_KEYS = {
    TASKS: 'taskflow_tasks',
    THEME: 'taskflow_theme',
    TTS_SETTINGS: 'taskflow_tts_settings',
    VIEW: 'taskflow_active_view'
  };

  const DEFAULT_SAMPLE_TASKS = [
    {
      id: 'task_sample_1',
      title: 'Complete quarterly productivity review',
      description: 'Analyze Q3 workflow metrics, review team achievements, and prepare the slide deck.',
      dueDate: getRelativeDateString(0), // Today
      priority: 'high',
      category: 'work',
      completed: false,
      important: true,
      createdAt: Date.now() - 3600000 * 4,
      updatedAt: Date.now() - 3600000 * 4
    },
    {
      id: 'task_sample_2',
      title: 'Review JavaScript SpeechSynthesis & Audio APIs',
      description: 'Explore browser voice synthesis options, utterance events, and audio visualizer styling.',
      dueDate: getRelativeDateString(1), // Tomorrow
      priority: 'medium',
      category: 'study',
      completed: false,
      important: false,
      createdAt: Date.now() - 3600000 * 8,
      updatedAt: Date.now() - 3600000 * 8
    },
    {
      id: 'task_sample_3',
      title: 'Weekly grocery shopping & pantry restock',
      description: 'Organic fruits, almond milk, whole-wheat bread, espresso beans, and sparkling water.',
      dueDate: getRelativeDateString(2),
      priority: 'low',
      category: 'shopping',
      completed: true,
      important: false,
      createdAt: Date.now() - 3600000 * 24,
      updatedAt: Date.now() - 3600000 * 2
    }
  ];

  const state = {
    tasks: [],
    activeFilter: 'all',     // 'all' | 'today' | 'upcoming' | 'important' | 'completed'
    activeCategory: null,    // null | 'work' | 'personal' | 'study' | 'shopping' | 'other'
    subfilter: 'all',        // 'all' | 'active' | 'completed'
    searchQuery: '',
    sortBy: 'newest',        // 'newest' | 'oldest' | 'dueDate' | 'priority' | 'alphabetical'
    theme: 'light',
    
    // TTS State
    tts: {
      isSupported: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
      voiceURI: '',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      isSpeaking: false,
      isPaused: false,
      currentTaskId: null,
      queue: [],
      queueIndex: 0
    },

    // Modal State
    editingTaskId: null,
    deletingTaskId: null
  };

  // --------------------------------------------------------------------------
  // 2. DOM Elements Cache
  // --------------------------------------------------------------------------
  const DOM = {
    // Top & Mobile
    greetingTitle: document.getElementById('greetingTitle'),
    currentDateSubtitle: document.getElementById('currentDateSubtitle'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    readAllBtn: document.getElementById('readAllBtn'),
    readAllBtnText: document.getElementById('readAllBtnText'),
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    mobileAddBtn: document.getElementById('mobileAddBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileThemeToggleBtn: document.getElementById('mobileThemeToggleBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    ttsUnsupportedBanner: document.getElementById('ttsUnsupportedBanner'),
    closeTtsBannerBtn: document.getElementById('closeTtsBannerBtn'),

    // Sidebar navigation & counts
    viewNavList: document.getElementById('viewNavList'),
    categoryNavList: document.getElementById('categoryNavList'),
    countAll: document.getElementById('countAll'),
    countToday: document.getElementById('countToday'),
    countUpcoming: document.getElementById('countUpcoming'),
    countImportant: document.getElementById('countImportant'),
    countCompleted: document.getElementById('countCompleted'),
    countWork: document.getElementById('countWork'),
    countPersonal: document.getElementById('countPersonal'),
    countStudy: document.getElementById('countStudy'),
    countShopping: document.getElementById('countShopping'),
    countOther: document.getElementById('countOther'),
    sidebarProgressPct: document.getElementById('sidebarProgressPct'),
    sidebarProgressBar: document.getElementById('sidebarProgressBar'),
    sidebarProgressText: document.getElementById('sidebarProgressText'),
    ttsSettingsBtn: document.getElementById('ttsSettingsBtn'),
    dataManageBtn: document.getElementById('dataManageBtn'),

    // KPIs
    kpiTotal: document.getElementById('kpiTotal'),
    kpiPending: document.getElementById('kpiPending'),
    kpiCompleted: document.getElementById('kpiCompleted'),
    kpiImportant: document.getElementById('kpiImportant'),

    // Speech Status Banner
    speechStatusBanner: document.getElementById('speechStatusBanner'),
    speechStatusLabel: document.getElementById('speechStatusLabel'),
    speechCurrentTaskText: document.getElementById('speechCurrentTaskText'),
    pauseSpeechBtn: document.getElementById('pauseSpeechBtn'),
    resumeSpeechBtn: document.getElementById('resumeSpeechBtn'),
    stopSpeechBtn: document.getElementById('stopSpeechBtn'),

    // Main Content Controls
    currentViewHeading: document.getElementById('currentViewHeading'),
    currentViewCount: document.getElementById('currentViewCount'),
    segmentedFilter: document.querySelector('.segmented-filter'),
    sortSelect: document.getElementById('sortSelect'),
    searchFeedbackBar: document.getElementById('searchFeedbackBar'),
    searchFeedbackText: document.getElementById('searchFeedbackText'),
    resetSearchFilterBtn: document.getElementById('resetSearchFilterBtn'),
    taskListContainer: document.getElementById('taskListContainer'),

    // Task Modal
    taskModal: document.getElementById('taskModal'),
    modalTitle: document.getElementById('modalTitle'),
    taskForm: document.getElementById('taskForm'),
    taskIdField: document.getElementById('taskIdField'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskDescInput: document.getElementById('taskDescInput'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    taskCategorySelect: document.getElementById('taskCategorySelect'),
    taskImportantCheck: document.getElementById('taskImportantCheck'),
    closeTaskModalBtn: document.getElementById('closeTaskModalBtn'),
    cancelTaskModalBtn: document.getElementById('cancelTaskModalBtn'),

    // TTS Settings Modal
    ttsModal: document.getElementById('ttsModal'),
    voiceSelect: document.getElementById('voiceSelect'),
    rateRange: document.getElementById('rateRange'),
    rateValueDisplay: document.getElementById('rateValueDisplay'),
    pitchRange: document.getElementById('pitchRange'),
    pitchValueDisplay: document.getElementById('pitchValueDisplay'),
    volumeRange: document.getElementById('volumeRange'),
    volumeValueDisplay: document.getElementById('volumeValueDisplay'),
    testVoiceBtn: document.getElementById('testVoiceBtn'),
    resetTtsBtn: document.getElementById('resetTtsBtn'),
    saveTtsModalBtn: document.getElementById('saveTtsModalBtn'),
    closeTtsModalBtn: document.getElementById('closeTtsModalBtn'),

    // Delete Confirmation Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteTaskPreviewTitle: document.getElementById('deleteTaskPreviewTitle'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),

    // Data Management Modal
    dataModal: document.getElementById('dataModal'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    importJsonFileInput: document.getElementById('importJsonFileInput'),
    clearAllTasksBtn: document.getElementById('clearAllTasksBtn'),
    closeDataModalBtn: document.getElementById('closeDataModalBtn'),
    closeDataModalFooterBtn: document.getElementById('closeDataModalFooterBtn'),

    // Toasts
    toastContainer: document.getElementById('toastContainer')
  };

  // --------------------------------------------------------------------------
  // 3. Helper Functions (Dates, IDs, Formatting)
  // --------------------------------------------------------------------------
  function generateId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  }

  function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getRelativeDateString(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatDateHuman(dateStr) {
    if (!dateStr) return null;
    
    // Parse date parts to prevent timezone offsets
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const taskDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((taskDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = `${monthNames[taskDate.getMonth()]} ${taskDate.getDate()}`;
    
    if (taskDate.getFullYear() !== today.getFullYear()) {
      return `${formatted}, ${taskDate.getFullYear()}`;
    }
    return formatted;
  }

  function getDateStatus(dateStr, isCompleted) {
    if (!dateStr || isCompleted) return 'normal';
    const today = getTodayDateString();
    if (dateStr === today) return 'today';
    if (dateStr < today) return 'overdue';
    return 'upcoming';
  }

  function updateDynamicGreeting() {
    const now = new Date();
    const hours = now.getHours();
    let greeting = 'Good morning';
    if (hours >= 12 && hours < 17) {
      greeting = 'Good afternoon';
    } else if (hours >= 17 || hours < 5) {
      greeting = 'Good evening';
    }
    DOM.greetingTitle.textContent = greeting;

    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    DOM.currentDateSubtitle.textContent = now.toLocaleDateString(undefined, options);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --------------------------------------------------------------------------
  // 4. LocalStorage & State Persistence
  // --------------------------------------------------------------------------
  function loadState() {
    // 1. Load Theme
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    // 2. Load Tasks
    try {
      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (storedTasks) {
        state.tasks = JSON.parse(storedTasks);
      } else {
        state.tasks = [...DEFAULT_SAMPLE_TASKS];
        saveTasks();
      }
    } catch (e) {
      console.error('Failed to parse tasks from localStorage', e);
      state.tasks = [...DEFAULT_SAMPLE_TASKS];
    }

    // 3. Load TTS Settings
    try {
      const storedTts = localStorage.getItem(STORAGE_KEYS.TTS_SETTINGS);
      if (storedTts) {
        const parsed = JSON.parse(storedTts);
        state.tts.voiceURI = parsed.voiceURI || '';
        state.tts.rate = typeof parsed.rate === 'number' ? parsed.rate : 1.0;
        state.tts.pitch = typeof parsed.pitch === 'number' ? parsed.pitch : 1.0;
        state.tts.volume = typeof parsed.volume === 'number' ? parsed.volume : 1.0;
      }
    } catch (e) {
      console.error('Failed to load TTS settings', e);
    }

    // Sync TTS settings UI
    syncTtsModalValues();
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
      showToast('Storage quota exceeded or storage unavailable', 'danger');
    }
  }

  function saveTtsSettings() {
    try {
      const settings = {
        voiceURI: state.tts.voiceURI,
        rate: state.tts.rate,
        pitch: state.tts.pitch,
        volume: state.tts.volume
      };
      localStorage.setItem(STORAGE_KEYS.TTS_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save TTS settings', e);
    }
  }

  function applyTheme(themeName) {
    state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem(STORAGE_KEYS.THEME, themeName);
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme} mode`, 'info');
  }

  // --------------------------------------------------------------------------
  // 5. Toast Notification System
  // --------------------------------------------------------------------------
  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // --------------------------------------------------------------------------
  // 6. Text-to-Speech (TTS) Voice Engine
  // --------------------------------------------------------------------------
  let availableVoices = [];

  function initSpeechEngine() {
    if (!state.tts.isSupported) {
      DOM.ttsUnsupportedBanner.style.display = 'flex';
      DOM.readAllBtn.disabled = true;
      DOM.readAllBtn.title = 'Text-to-Speech is not supported in this browser.';
      return;
    }

    // Populate voices when loaded
    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }

  function populateVoices() {
    if (!state.tts.isSupported) return;
    availableVoices = window.speechSynthesis.getVoices();
    DOM.voiceSelect.innerHTML = '';

    if (availableVoices.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Default System Voice';
      DOM.voiceSelect.appendChild(option);
      return;
    }

    let selectedIndex = 0;
    availableVoices.forEach((voice, index) => {
      const option = document.createElement('option');
      option.value = voice.voiceURI || voice.name;
      option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' — Default' : ''}`;
      
      if (state.tts.voiceURI && (voice.voiceURI === state.tts.voiceURI || voice.name === state.tts.voiceURI)) {
        selectedIndex = index;
      }
      DOM.voiceSelect.appendChild(option);
    });

    if (DOM.voiceSelect.options.length > 0) {
      DOM.voiceSelect.selectedIndex = selectedIndex;
    }
  }

  function getSelectedVoiceObject() {
    if (!state.tts.isSupported || availableVoices.length === 0) return null;
    const uri = state.tts.voiceURI;
    if (uri) {
      const match = availableVoices.find(v => v.voiceURI === uri || v.name === uri);
      if (match) return match;
    }
    return availableVoices.find(v => v.default) || availableVoices[0] || null;
  }

  function buildTaskSpeechText(task) {
    let sentence = `Task: ${task.title}. `;
    if (task.description && task.description.trim()) {
      sentence += `Description: ${task.description.trim()}. `;
    }
    sentence += `Priority: ${task.priority}. `;
    if (task.category) {
      sentence += `Category: ${task.category}. `;
    }
    if (task.dueDate) {
      const status = getDateStatus(task.dueDate, task.completed);
      if (status === 'today') {
        sentence += `Due today. `;
      } else if (status === 'overdue') {
        sentence += `Overdue. Was due on ${formatDateHuman(task.dueDate)}. `;
      } else {
        sentence += `Due date: ${formatDateHuman(task.dueDate)}. `;
      }
    }
    return sentence;
  }

  function speakSingleTask(task) {
    if (!state.tts.isSupported) {
      showToast('Text-to-Speech is not supported in this browser.', 'warning');
      return;
    }

    stopSpeech();

    const speechText = buildTaskSpeechText(task);
    const utterance = new SpeechSynthesisUtterance(speechText);
    const voiceObj = getSelectedVoiceObject();
    if (voiceObj) utterance.voice = voiceObj;
    utterance.rate = state.tts.rate;
    utterance.pitch = state.tts.pitch;
    utterance.volume = state.tts.volume;

    state.tts.isSpeaking = true;
    state.tts.isPaused = false;
    state.tts.currentTaskId = task.id;
    state.tts.queue = [task];
    state.tts.queueIndex = 0;

    updateSpeechUI();
    highlightSpeakingTaskCard(task.id);

    utterance.onend = function () {
      state.tts.isSpeaking = false;
      state.tts.isPaused = false;
      state.tts.currentTaskId = null;
      updateSpeechUI();
      unhighlightAllTaskCards();
    };

    utterance.onerror = function (event) {
      console.warn('SpeechSynthesis error:', event);
      state.tts.isSpeaking = false;
      state.tts.isPaused = false;
      state.tts.currentTaskId = null;
      updateSpeechUI();
      unhighlightAllTaskCards();
    };

    window.speechSynthesis.speak(utterance);
  }

  function readAllPendingTasks() {
    if (!state.tts.isSupported) {
      showToast('Text-to-Speech is not supported in this browser.', 'warning');
      return;
    }

    stopSpeech();

    // Get incomplete tasks based on active filtering
    const pendingTasks = getFilteredTasks().filter(t => !t.completed);

    if (pendingTasks.length === 0) {
      const emptyUtterance = new SpeechSynthesisUtterance("You have no pending tasks to read.");
      const voiceObj = getSelectedVoiceObject();
      if (voiceObj) emptyUtterance.voice = voiceObj;
      emptyUtterance.rate = state.tts.rate;
      emptyUtterance.pitch = state.tts.pitch;
      emptyUtterance.volume = state.tts.volume;
      window.speechSynthesis.speak(emptyUtterance);
      showToast('No pending tasks to read', 'info');
      return;
    }

    state.tts.isSpeaking = true;
    state.tts.isPaused = false;
    state.tts.queue = pendingTasks;
    state.tts.queueIndex = 0;

    // Intro sentence
    const countText = pendingTasks.length === 1 ? '1 pending task' : `${pendingTasks.length} pending tasks`;
    const introUtterance = new SpeechSynthesisUtterance(`You have ${countText}.`);
    const voiceObj = getSelectedVoiceObject();
    if (voiceObj) introUtterance.voice = voiceObj;
    introUtterance.rate = state.tts.rate;
    introUtterance.pitch = state.tts.pitch;
    introUtterance.volume = state.tts.volume;

    introUtterance.onstart = function () {
      DOM.speechStatusLabel.textContent = 'Voice Assistant';
      DOM.speechCurrentTaskText.textContent = `Announcing ${countText}...`;
      updateSpeechUI();
    };

    introUtterance.onend = function () {
      playNextInQueue();
    };

    introUtterance.onerror = function (e) {
      console.warn('Intro utterance error:', e);
      stopSpeech();
    };

    window.speechSynthesis.speak(introUtterance);
  }

  function playNextInQueue() {
    if (!state.tts.isSpeaking) return;

    if (state.tts.queueIndex >= state.tts.queue.length) {
      // Completed queue
      state.tts.isSpeaking = false;
      state.tts.isPaused = false;
      state.tts.currentTaskId = null;
      updateSpeechUI();
      unhighlightAllTaskCards();
      showToast('Finished reading all pending tasks', 'success');
      return;
    }

    const currentTask = state.tts.queue[state.tts.queueIndex];
    state.tts.currentTaskId = currentTask.id;
    highlightSpeakingTaskCard(currentTask.id);

    const taskNumber = state.tts.queueIndex + 1;
    const taskSpeech = `Task ${taskNumber}. ${buildTaskSpeechText(currentTask)}`;
    const utterance = new SpeechSynthesisUtterance(taskSpeech);
    const voiceObj = getSelectedVoiceObject();
    if (voiceObj) utterance.voice = voiceObj;
    utterance.rate = state.tts.rate;
    utterance.pitch = state.tts.pitch;
    utterance.volume = state.tts.volume;

    utterance.onstart = function () {
      DOM.speechStatusLabel.textContent = `Reading Task ${taskNumber} of ${state.tts.queue.length}`;
      DOM.speechCurrentTaskText.textContent = currentTask.title;
      updateSpeechUI();
    };

    utterance.onend = function () {
      state.tts.queueIndex++;
      playNextInQueue();
    };

    utterance.onerror = function (e) {
      console.warn('Queue item utterance error:', e);
      state.tts.queueIndex++;
      playNextInQueue();
    };

    window.speechSynthesis.speak(utterance);
  }

  function pauseSpeech() {
    if (state.tts.isSupported && state.tts.isSpeaking && !state.tts.isPaused) {
      window.speechSynthesis.pause();
      state.tts.isPaused = true;
      updateSpeechUI();
    }
  }

  function resumeSpeech() {
    if (state.tts.isSupported && state.tts.isSpeaking && state.tts.isPaused) {
      window.speechSynthesis.resume();
      state.tts.isPaused = false;
      updateSpeechUI();
    }
  }

  function stopSpeech() {
    if (state.tts.isSupported) {
      window.speechSynthesis.cancel();
    }
    state.tts.isSpeaking = false;
    state.tts.isPaused = false;
    state.tts.currentTaskId = null;
    state.tts.queue = [];
    state.tts.queueIndex = 0;
    updateSpeechUI();
    unhighlightAllTaskCards();
  }

  function updateSpeechUI() {
    if (state.tts.isSpeaking) {
      DOM.speechStatusBanner.style.display = 'flex';
      DOM.readAllBtnText.textContent = 'Reading...';
      
      if (state.tts.isPaused) {
        DOM.pauseSpeechBtn.style.display = 'none';
        DOM.resumeSpeechBtn.style.display = 'inline-flex';
        DOM.speechStatusLabel.textContent = 'Speech Paused';
      } else {
        DOM.pauseSpeechBtn.style.display = 'inline-flex';
        DOM.resumeSpeechBtn.style.display = 'none';
      }
    } else {
      DOM.speechStatusBanner.style.display = 'none';
      DOM.readAllBtnText.textContent = 'Read Tasks';
    }
  }

  function highlightSpeakingTaskCard(taskId) {
    unhighlightAllTaskCards();
    if (!taskId) return;
    const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
    if (card) {
      card.classList.add('is-speaking');
      // Scroll into view if out of viewport smoothly
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function unhighlightAllTaskCards() {
    document.querySelectorAll('.task-card.is-speaking').forEach(card => {
      card.classList.remove('is-speaking');
    });
  }

  function syncTtsModalValues() {
    DOM.rateRange.value = state.tts.rate;
    DOM.rateValueDisplay.textContent = `${state.tts.rate.toFixed(1)}x`;

    DOM.pitchRange.value = state.tts.pitch;
    DOM.pitchValueDisplay.textContent = state.tts.pitch.toFixed(1);

    DOM.volumeRange.value = state.tts.volume;
    DOM.volumeValueDisplay.textContent = `${Math.round(state.tts.volume * 100)}%`;

    if (state.tts.voiceURI && DOM.voiceSelect.options.length > 0) {
      DOM.voiceSelect.value = state.tts.voiceURI;
    }
  }

  // --------------------------------------------------------------------------
  // 7. Filtering, Sorting & Search Logic
  // --------------------------------------------------------------------------
  function getFilteredTasks() {
    let list = [...state.tasks];
    const todayStr = getTodayDateString();

    // 1. Sidebar Primary View Filter
    if (state.activeFilter === 'today') {
      list = list.filter(t => t.dueDate === todayStr);
    } else if (state.activeFilter === 'upcoming') {
      list = list.filter(t => t.dueDate && t.dueDate > todayStr && !t.completed);
    } else if (state.activeFilter === 'important') {
      list = list.filter(t => t.important);
    } else if (state.activeFilter === 'completed') {
      list = list.filter(t => t.completed);
    }

    // 2. Category Filter (if active)
    if (state.activeCategory) {
      list = list.filter(t => t.category === state.activeCategory);
    }

    // 3. Segmented Subfilter: All / Active / Completed
    if (state.subfilter === 'active') {
      list = list.filter(t => !t.completed);
    } else if (state.subfilter === 'completed') {
      list = list.filter(t => t.completed);
    }

    // 4. Live Search Filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter(t => {
        const titleMatch = t.title && t.title.toLowerCase().includes(q);
        const descMatch = t.description && t.description.toLowerCase().includes(q);
        const catMatch = t.category && t.category.toLowerCase().includes(q);
        const prioMatch = t.priority && t.priority.toLowerCase().includes(q);
        return titleMatch || descMatch || catMatch || prioMatch;
      });
    }

    // 5. Sorting
    list.sort((a, b) => {
      // Completed items always sink to the bottom if viewing mixed tasks
      if (state.subfilter === 'all' && state.activeFilter !== 'completed') {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
      }

      if (state.sortBy === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else if (state.sortBy === 'oldest') {
        return (a.createdAt || 0) - (b.createdAt || 0);
      } else if (state.sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      } else if (state.sortBy === 'priority') {
        const weights = { high: 3, medium: 2, low: 1 };
        return (weights[b.priority] || 0) - (weights[a.priority] || 0);
      } else if (state.sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }

  // --------------------------------------------------------------------------
  // 8. Render Engine
  // --------------------------------------------------------------------------
  function renderAll() {
    renderKPIsAndBadges();
    renderHeadingAndControls();
    renderTaskList();
    if (state.tts.currentTaskId) {
      highlightSpeakingTaskCard(state.tts.currentTaskId);
    }
  }

  function renderKPIsAndBadges() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const important = state.tasks.filter(t => t.important).length;
    const todayStr = getTodayDateString();

    // KPIs
    DOM.kpiTotal.textContent = total;
    DOM.kpiPending.textContent = pending;
    DOM.kpiCompleted.textContent = completed;
    DOM.kpiImportant.textContent = important;

    // Sidebar View Badges
    DOM.countAll.textContent = total;
    DOM.countToday.textContent = state.tasks.filter(t => t.dueDate === todayStr).length;
    DOM.countUpcoming.textContent = state.tasks.filter(t => t.dueDate && t.dueDate > todayStr && !t.completed).length;
    DOM.countImportant.textContent = important;
    DOM.countCompleted.textContent = completed;

    // Sidebar Category Badges
    DOM.countWork.textContent = state.tasks.filter(t => t.category === 'work').length;
    DOM.countPersonal.textContent = state.tasks.filter(t => t.category === 'personal').length;
    DOM.countStudy.textContent = state.tasks.filter(t => t.category === 'study').length;
    DOM.countShopping.textContent = state.tasks.filter(t => t.category === 'shopping').length;
    DOM.countOther.textContent = state.tasks.filter(t => t.category === 'other').length;

    // Sidebar Productivity Progress Card
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    DOM.sidebarProgressPct.textContent = `${pct}%`;
    DOM.sidebarProgressBar.style.width = `${pct}%`;
    DOM.sidebarProgressText.textContent = `${completed} of ${total} tasks completed`;
  }

  function renderHeadingAndControls() {
    let heading = 'All Tasks';
    if (state.activeCategory) {
      heading = `${state.activeCategory.charAt(0).toUpperCase() + state.activeCategory.slice(1)} Tasks`;
    } else if (state.activeFilter === 'today') {
      heading = "Today's Tasks";
    } else if (state.activeFilter === 'upcoming') {
      heading = 'Upcoming Tasks';
    } else if (state.activeFilter === 'important') {
      heading = 'Important Tasks';
    } else if (state.activeFilter === 'completed') {
      heading = 'Completed Tasks';
    }

    DOM.currentViewHeading.textContent = heading;

    // Active navigation item highlight
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      btn.classList.remove('active');
      if (state.activeCategory && btn.dataset.category === state.activeCategory) {
        btn.classList.add('active');
      } else if (!state.activeCategory && btn.dataset.filter === state.activeFilter) {
        btn.classList.add('active');
      }
    });

    // Segmented Subfilter buttons
    document.querySelectorAll('.segmented-filter .segment-btn').forEach(btn => {
      const isActive = btn.dataset.subfilter === state.subfilter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Search Feedback strip
    if (state.searchQuery.trim()) {
      DOM.searchFeedbackBar.style.display = 'flex';
      DOM.searchFeedbackText.textContent = `Showing results for "${state.searchQuery}"`;
      DOM.clearSearchBtn.style.display = 'block';
    } else {
      DOM.searchFeedbackBar.style.display = 'none';
      DOM.clearSearchBtn.style.display = 'none';
    }
  }

  function renderTaskList() {
    const filteredTasks = getFilteredTasks();
    const count = filteredTasks.length;
    DOM.currentViewCount.textContent = `${count} ${count === 1 ? 'task' : 'tasks'}`;

    if (count === 0) {
      renderEmptyState();
      return;
    }

    let html = '';
    filteredTasks.forEach(task => {
      const isCompleted = !!task.completed;
      const isImportant = !!task.important;
      const dateHuman = formatDateHuman(task.dueDate);
      const dateStatus = getDateStatus(task.dueDate, isCompleted);

      // Due Date Badge
      let dueDateBadge = '';
      if (dateHuman) {
        let pillClass = 'pill-due-upcoming';
        let labelPrefix = '';
        if (dateStatus === 'overdue') {
          pillClass = 'pill-due-overdue';
          labelPrefix = 'Overdue · ';
        } else if (dateStatus === 'today') {
          pillClass = 'pill-due-today';
        }
        dueDateBadge = `
          <span class="meta-pill ${pillClass}">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>${labelPrefix}${escapeHtml(dateHuman)}</span>
          </span>
        `;
      }

      // Priority Badge
      const prioCapitalized = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      const priorityBadge = `
        <span class="meta-pill pill-priority-${task.priority}">
          <span>${prioCapitalized}</span>
        </span>
      `;

      // Category Badge
      const catCapitalized = task.category ? task.category.charAt(0).toUpperCase() + task.category.slice(1) : 'Other';
      const categoryBadge = `
        <span class="meta-pill pill-cat-${task.category || 'other'}">
          <span>${catCapitalized}</span>
        </span>
      `;

      // Description
      const descHtml = task.description && task.description.trim()
        ? `<div class="task-desc">${escapeHtml(task.description)}</div>`
        : '';

      html += `
        <article class="task-card ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
          <div class="task-checkbox-wrap">
            <button class="task-check-btn ${isCompleted ? 'checked' : ''}" data-action="toggle-complete" data-id="${task.id}" aria-label="${isCompleted ? 'Mark as incomplete' : 'Mark as complete'}">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>

          <div class="task-body">
            <div class="task-title-row">
              <span class="task-title">${escapeHtml(task.title)}</span>
            </div>
            ${descHtml}
            <div class="task-meta-row">
              ${categoryBadge}
              ${dueDateBadge}
              ${priorityBadge}
            </div>
          </div>

          <div class="task-actions-wrap">
            <button class="task-action-btn star-btn ${isImportant ? 'is-important' : ''}" data-action="toggle-star" data-id="${task.id}" title="${isImportant ? 'Unmark important' : 'Mark important'}" aria-label="Toggle star">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </button>
            <button class="task-action-btn speak-task-btn" data-action="speak-task" data-id="${task.id}" title="Read this task aloud" aria-label="Speak task">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            </button>
            <button class="task-action-btn edit-task-btn" data-action="edit-task" data-id="${task.id}" title="Edit task" aria-label="Edit task">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
            <button class="task-action-btn delete-task-btn" data-action="delete-task" data-id="${task.id}" title="Delete task" aria-label="Delete task">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </article>
      `;
    });

    DOM.taskListContainer.innerHTML = html;
  }

  function renderEmptyState() {
    let iconSvg = '';
    let title = 'No tasks yet';
    let desc = 'Add your first task and start organizing your day effortlessly.';
    let showAddBtn = true;

    if (state.searchQuery.trim()) {
      iconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
      title = 'No matching tasks';
      desc = `We couldn't find anything matching "${escapeHtml(state.searchQuery)}". Try another keyword.`;
      showAddBtn = false;
    } else if (state.activeFilter === 'completed' || state.subfilter === 'completed') {
      iconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      title = 'No completed tasks yet';
      desc = 'Check off tasks as you finish them to see your progress here.';
      showAddBtn = false;
    } else if (state.activeFilter === 'important') {
      iconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
      title = 'No important tasks starred';
      desc = 'Star high-priority tasks to keep them easily accessible here.';
      showAddBtn = true;
    } else if (state.activeFilter === 'today') {
      iconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
      title = 'All clear for today!';
      desc = 'You have no tasks due today. Enjoy your time or plan ahead.';
      showAddBtn = true;
    } else {
      iconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>`;
    }

    const buttonHtml = showAddBtn
      ? `<button class="btn btn-primary btn-sm" onclick="document.getElementById('openAddModalBtn').click()">
           <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
           <span>Add Task</span>
         </button>`
      : '';

    DOM.taskListContainer.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-state-icon">${iconSvg}</div>
        <div class="empty-state-title">${title}</div>
        <p class="empty-state-desc">${desc}</p>
        ${buttonHtml}
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // 9. Task CRUD Operations
  // --------------------------------------------------------------------------
  function openCreateTaskModal() {
    state.editingTaskId = null;
    DOM.modalTitle.textContent = 'Create New Task';
    DOM.taskIdField.value = '';
    DOM.taskTitleInput.value = '';
    DOM.taskDescInput.value = '';
    DOM.taskDueDateInput.value = getTodayDateString();
    DOM.taskCategorySelect.value = state.activeCategory || 'work';
    DOM.taskImportantCheck.checked = state.activeFilter === 'important';
    
    // Priority Radio reset
    const medRadio = DOM.taskForm.querySelector('input[name="taskPriority"][value="medium"]');
    if (medRadio) medRadio.checked = true;

    DOM.taskTitleInput.classList.remove('is-invalid');
    DOM.taskModal.style.display = 'flex';
    setTimeout(() => DOM.taskTitleInput.focus(), 50);
  }

  function openEditTaskModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    state.editingTaskId = taskId;
    DOM.modalTitle.textContent = 'Edit Task';
    DOM.taskIdField.value = task.id;
    DOM.taskTitleInput.value = task.title;
    DOM.taskDescInput.value = task.description || '';
    DOM.taskDueDateInput.value = task.dueDate || '';
    DOM.taskCategorySelect.value = task.category || 'work';
    DOM.taskImportantCheck.checked = !!task.important;

    const radio = DOM.taskForm.querySelector(`input[name="taskPriority"][value="${task.priority}"]`);
    if (radio) radio.checked = true;

    DOM.taskTitleInput.classList.remove('is-invalid');
    DOM.taskModal.style.display = 'flex';
    setTimeout(() => DOM.taskTitleInput.focus(), 50);
  }

  function closeTaskModal() {
    DOM.taskModal.style.display = 'none';
    state.editingTaskId = null;
    DOM.taskForm.reset();
  }

  function handleTaskFormSubmit(e) {
    e.preventDefault();
    const title = DOM.taskTitleInput.value.trim();
    if (!title) {
      DOM.taskTitleInput.classList.add('is-invalid');
      DOM.taskTitleInput.focus();
      return;
    }

    const selectedPriority = (DOM.taskForm.querySelector('input[name="taskPriority"]:checked') || {}).value || 'medium';
    const description = DOM.taskDescInput.value.trim();
    const dueDate = DOM.taskDueDateInput.value || null;
    const category = DOM.taskCategorySelect.value || 'work';
    const important = DOM.taskImportantCheck.checked;

    if (state.editingTaskId) {
      // Update
      const taskIndex = state.tasks.findIndex(t => t.id === state.editingTaskId);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = {
          ...state.tasks[taskIndex],
          title,
          description,
          dueDate,
          category,
          priority: selectedPriority,
          important,
          updatedAt: Date.now()
        };
        showToast('Task updated successfully', 'success');
      }
    } else {
      // Create
      const newTask = {
        id: generateId(),
        title,
        description,
        dueDate,
        category,
        priority: selectedPriority,
        completed: false,
        important,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      state.tasks.unshift(newTask);
      showToast('Task created', 'success');
    }

    saveTasks();
    closeTaskModal();
    renderAll();
  }

  function toggleTaskComplete(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.updatedAt = Date.now();
    saveTasks();
    renderAll();

    if (task.completed) {
      showToast('Task marked as completed', 'success');
      // If active TTS is speaking this task, move to next
      if (state.tts.currentTaskId === taskId) {
        stopSpeech();
      }
    }
  }

  function toggleTaskStar(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.important = !task.important;
    task.updatedAt = Date.now();
    saveTasks();
    renderAll();
    showToast(task.important ? 'Marked as important' : 'Removed from important', 'info');
  }

  function openDeleteConfirmModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    state.deletingTaskId = taskId;
    DOM.deleteTaskPreviewTitle.textContent = task.title;
    DOM.deleteModal.style.display = 'flex';
  }

  function closeDeleteModal() {
    DOM.deleteModal.style.display = 'none';
    state.deletingTaskId = null;
  }

  function handleConfirmDelete() {
    if (!state.deletingTaskId) return;

    if (state.tts.currentTaskId === state.deletingTaskId) {
      stopSpeech();
    }

    state.tasks = state.tasks.filter(t => t.id !== state.deletingTaskId);
    saveTasks();
    closeDeleteModal();
    renderAll();
    showToast('Task deleted', 'danger');
  }

  // --------------------------------------------------------------------------
  // 10. Data Management (Export / Import / Clear)
  // --------------------------------------------------------------------------
  function openDataModal() {
    DOM.dataModal.style.display = 'flex';
  }

  function closeDataModal() {
    DOM.dataModal.style.display = 'none';
  }

  function exportTasksJson() {
    const backupData = {
      app: 'TaskFlow',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: state.tasks
    };
    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `taskflow-backup-${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup JSON downloaded', 'success');
  }

  function handleImportJsonFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const parsed = JSON.parse(event.target.result);
        const importedTasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);

        if (!Array.isArray(importedTasks)) {
          throw new Error('Invalid JSON format: expected an array of tasks.');
        }

        // Validate each task item
        const validTasks = importedTasks.filter(item => item && typeof item.title === 'string' && item.title.trim().length > 0)
          .map(item => ({
            id: item.id || generateId(),
            title: item.title.trim(),
            description: item.description || '',
            dueDate: item.dueDate || null,
            priority: ['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium',
            category: ['work', 'personal', 'study', 'shopping', 'other'].includes(item.category) ? item.category : 'other',
            completed: !!item.completed,
            important: !!item.important,
            createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
            updatedAt: Date.now()
          }));

        if (validTasks.length === 0) {
          showToast('No valid tasks found in JSON file.', 'warning');
          return;
        }

        // Merge without duplicates
        const existingIds = new Set(state.tasks.map(t => t.id));
        let addedCount = 0;
        validTasks.forEach(task => {
          if (!existingIds.has(task.id)) {
            state.tasks.push(task);
            addedCount++;
          }
        });

        saveTasks();
        renderAll();
        closeDataModal();
        showToast(`Successfully imported ${addedCount} tasks!`, 'success');
      } catch (err) {
        console.error('Import error:', err);
        showToast('Failed to import JSON file. Please check file structure.', 'danger');
      } finally {
        DOM.importJsonFileInput.value = '';
      }
    };
    reader.readAsText(file);
  }

  function handleClearAllTasks() {
    if (confirm('Are you absolutely sure you want to delete ALL tasks and reset data? This cannot be undone.')) {
      stopSpeech();
      state.tasks = [];
      saveTasks();
      closeDataModal();
      renderAll();
      showToast('All tasks and data cleared', 'danger');
    }
  }

  // --------------------------------------------------------------------------
  // 11. Event Listeners Setup
  // --------------------------------------------------------------------------
  function initEventListeners() {
    // 1. Sidebar Nav Views
    DOM.viewNavList.addEventListener('click', e => {
      const btn = e.target.closest('.nav-item');
      if (!btn) return;
      state.activeFilter = btn.dataset.filter || 'all';
      state.activeCategory = null;
      renderAll();
      closeMobileSidebar();
    });

    // 2. Sidebar Nav Categories
    DOM.categoryNavList.addEventListener('click', e => {
      const btn = e.target.closest('.nav-item');
      if (!btn) return;
      state.activeCategory = btn.dataset.category || null;
      state.activeFilter = 'all';
      renderAll();
      closeMobileSidebar();
    });

    // 3. Segmented Subfilters (All / Active / Completed)
    DOM.segmentedFilter.addEventListener('click', e => {
      const btn = e.target.closest('.segment-btn');
      if (!btn) return;
      state.subfilter = btn.dataset.subfilter || 'all';
      renderAll();
    });

    // 4. Sort Dropdown
    DOM.sortSelect.addEventListener('change', e => {
      state.sortBy = e.target.value;
      renderAll();
    });

    // 5. Live Search Input
    DOM.searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value;
      renderAll();
    });

    DOM.clearSearchBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      state.searchQuery = '';
      renderAll();
      DOM.searchInput.focus();
    });

    DOM.resetSearchFilterBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      state.searchQuery = '';
      renderAll();
    });

    // 6. Header Action Buttons
    DOM.openAddModalBtn.addEventListener('click', openCreateTaskModal);
    DOM.mobileAddBtn.addEventListener('click', openCreateTaskModal);
    DOM.readAllBtn.addEventListener('click', () => {
      if (state.tts.isSpeaking) {
        stopSpeech();
      } else {
        readAllPendingTasks();
      }
    });

    // 7. Theme Toggles
    DOM.themeToggleBtn.addEventListener('click', toggleTheme);
    DOM.mobileThemeToggleBtn.addEventListener('click', toggleTheme);

    // 8. Mobile Sidebar Menu
    DOM.mobileMenuBtn.addEventListener('click', openMobileSidebar);
    DOM.sidebarBackdrop.addEventListener('click', closeMobileSidebar);

    // 9. Speech Control Banner Buttons
    DOM.pauseSpeechBtn.addEventListener('click', pauseSpeech);
    DOM.resumeSpeechBtn.addEventListener('click', resumeSpeech);
    DOM.stopSpeechBtn.addEventListener('click', stopSpeech);

    // 10. Task List Delegated Click Handling (Checkbox, Star, Speak, Edit, Delete)
    DOM.taskListContainer.addEventListener('click', e => {
      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;

      const action = actionBtn.dataset.action;
      const taskId = actionBtn.dataset.id;
      if (!taskId) return;

      if (action === 'toggle-complete') {
        toggleTaskComplete(taskId);
      } else if (action === 'toggle-star') {
        toggleTaskStar(taskId);
      } else if (action === 'speak-task') {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) speakSingleTask(task);
      } else if (action === 'edit-task') {
        openEditTaskModal(taskId);
      } else if (action === 'delete-task') {
        openDeleteConfirmModal(taskId);
      }
    });

    // 11. Modals: Task Form Modal
    DOM.taskForm.addEventListener('submit', handleTaskFormSubmit);
    DOM.closeTaskModalBtn.addEventListener('click', closeTaskModal);
    DOM.cancelTaskModalBtn.addEventListener('click', closeTaskModal);

    DOM.taskTitleInput.addEventListener('input', () => {
      DOM.taskTitleInput.classList.remove('is-invalid');
    });

    // 12. Modals: Delete Modal
    DOM.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    DOM.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    DOM.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

    // 13. Modals: TTS Settings Modal
    DOM.ttsSettingsBtn.addEventListener('click', () => {
      syncTtsModalValues();
      DOM.ttsModal.style.display = 'flex';
    });

    DOM.closeTtsModalBtn.addEventListener('click', () => {
      DOM.ttsModal.style.display = 'none';
    });

    DOM.rateRange.addEventListener('input', e => {
      state.tts.rate = parseFloat(e.target.value);
      DOM.rateValueDisplay.textContent = `${state.tts.rate.toFixed(1)}x`;
    });

    DOM.pitchRange.addEventListener('input', e => {
      state.tts.pitch = parseFloat(e.target.value);
      DOM.pitchValueDisplay.textContent = state.tts.pitch.toFixed(1);
    });

    DOM.volumeRange.addEventListener('input', e => {
      state.tts.volume = parseFloat(e.target.value);
      DOM.volumeValueDisplay.textContent = `${Math.round(state.tts.volume * 100)}%`;
    });

    DOM.voiceSelect.addEventListener('change', e => {
      state.tts.voiceURI = e.target.value;
    });

    DOM.testVoiceBtn.addEventListener('click', () => {
      if (!state.tts.isSupported) return;
      window.speechSynthesis.cancel();
      const testUtterance = new SpeechSynthesisUtterance('Hello! This is your TaskFlow Voice Assistant.');
      const voiceObj = getSelectedVoiceObject();
      if (voiceObj) testUtterance.voice = voiceObj;
      testUtterance.rate = state.tts.rate;
      testUtterance.pitch = state.tts.pitch;
      testUtterance.volume = state.tts.volume;
      window.speechSynthesis.speak(testUtterance);
    });

    DOM.resetTtsBtn.addEventListener('click', () => {
      state.tts.rate = 1.0;
      state.tts.pitch = 1.0;
      state.tts.volume = 1.0;
      state.tts.voiceURI = '';
      syncTtsModalValues();
      saveTtsSettings();
      showToast('TTS settings reset to default', 'info');
    });

    DOM.saveTtsModalBtn.addEventListener('click', () => {
      state.tts.voiceURI = DOM.voiceSelect.value;
      saveTtsSettings();
      DOM.ttsModal.style.display = 'none';
      showToast('Voice settings saved', 'success');
    });

    // 14. Modals: Data Backup & Management
    DOM.dataManageBtn.addEventListener('click', openDataModal);
    DOM.closeDataModalBtn.addEventListener('click', closeDataModal);
    DOM.closeDataModalFooterBtn.addEventListener('click', closeDataModal);
    DOM.exportJsonBtn.addEventListener('click', exportTasksJson);
    DOM.importJsonFileInput.addEventListener('change', handleImportJsonFile);
    DOM.clearAllTasksBtn.addEventListener('click', handleClearAllTasks);

    // 15. Unsupported Banner Dismiss
    DOM.closeTtsBannerBtn.addEventListener('click', () => {
      DOM.ttsUnsupportedBanner.style.display = 'none';
    });

    // 16. Global Modal Backdrop Click Dismissal
    window.addEventListener('click', e => {
      if (e.target === DOM.taskModal) closeTaskModal();
      if (e.target === DOM.ttsModal) DOM.ttsModal.style.display = 'none';
      if (e.target === DOM.deleteModal) closeDeleteModal();
      if (e.target === DOM.dataModal) closeDataModal();
    });

    // 17. Keyboard Shortcuts (N, /, Escape)
    window.addEventListener('keydown', e => {
      const activeEl = document.activeElement;
      const isInputActive = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');

      // Escape key closes modals, mobile sidebar, or stops speech
      if (e.key === 'Escape') {
        if (DOM.taskModal.style.display === 'flex') {
          closeTaskModal();
          return;
        }
        if (DOM.ttsModal.style.display === 'flex') {
          DOM.ttsModal.style.display = 'none';
          return;
        }
        if (DOM.deleteModal.style.display === 'flex') {
          closeDeleteModal();
          return;
        }
        if (DOM.dataModal.style.display === 'flex') {
          closeDataModal();
          return;
        }
        if (DOM.sidebar.classList.contains('open')) {
          closeMobileSidebar();
          return;
        }
        if (state.tts.isSpeaking) {
          stopSpeech();
          return;
        }
      }

      // If user is typing inside an input/textarea, do NOT trigger single-key shortcuts
      if (isInputActive) return;

      // 'N' or 'n' -> New Task
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        openCreateTaskModal();
      }

      // '/' -> Focus Search Box
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        DOM.searchInput.focus();
        DOM.searchInput.select();
      }
    });
  }

  function openMobileSidebar() {
    DOM.sidebar.classList.add('open');
    DOM.sidebarBackdrop.classList.add('open');
  }

  function closeMobileSidebar() {
    DOM.sidebar.classList.remove('open');
    DOM.sidebarBackdrop.classList.remove('open');
  }

  // --------------------------------------------------------------------------
  // 12. App Initialization
  // --------------------------------------------------------------------------
  function initApp() {
    updateDynamicGreeting();
    loadState();
    initSpeechEngine();
    initEventListeners();
    renderAll();
  }

  // Run when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();