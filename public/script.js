const API_URL = '/api';
const randomQuoteApiUrl = 'https://api.quotable.io/random';
const quoteDisplayElement = document.getElementById('quoteDisplay');
const quoteInputElement = document.getElementById('quoteInput');
const timerElement = document.getElementById('timer');
const speedElement = document.getElementById('speed');
const pauseBtn = document.getElementById('pauseBtn');
const logoutBtn = document.getElementById('logoutBtn');
const restartBtn = document.getElementById('restartBtn');
const roundHistoryElement = document.getElementById('roundHistory');

// Round history storage
let roundHistory = JSON.parse(localStorage.getItem('roundHistory')) || [];
let currentRoundStartTime = null;

// Authentication functions
function getToken() {
    return sessionStorage.getItem('token');
}

function setToken(token) {
    sessionStorage.setItem('token', token);
}

function removeToken() {
    sessionStorage.removeItem('token');
}

function isLoggedIn() {
    return getToken() !== null;
}

async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            setToken(data.token);
            return { success: true, message: data.message };
        } else {
            return { success: false, message: data.error };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

async function signup(username, password) {
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            setToken(data.token);
            return { success: true, message: data.message };
        } else {
            return { success: false, message: data.error };
        }
    } catch (error) {
        console.error('Signup error:', error);
        return { success: false, message: 'Network error. Please try again.' };
    }
}

function logout() {
    removeToken();
    window.location.href = 'login.html';
}

// Check authentication state on page load
const currentPage = window.location.pathname.split('/').pop();
const isIndexPage = currentPage === '' || currentPage === 'index.html';
const isAuthPage = currentPage === 'login.html' || currentPage === 'signup.html';

if (isIndexPage && !isLoggedIn()) {
    window.location.href = 'login.html';
}

if (isAuthPage && isLoggedIn()) {
    window.location.href = 'index.html';
}

// Handle login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const message = document.getElementById('message');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        // Disable button during request
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        const result = await login(username, password);

        if (result.success) {
            message.textContent = 'Login successful!';
            message.className = 'success';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            message.textContent = result.message;
            message.className = 'error';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });
}

// Handle signup form
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const message = document.getElementById('message');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (password !== confirmPassword) {
            message.textContent = 'Passwords do not match.';
            message.className = 'error';
            return;
        }

        // Disable button during request
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing up...';

        const result = await signup(username, password);

        if (result.success) {
            message.textContent = 'Signup successful! Redirecting...';
            message.className = 'success';
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            message.textContent = result.message;
            message.className = 'error';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
        }
    });
}

// Logout button handler
if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

let startTime = null;
let timerInterval = null;
let isPaused = false;
let elapsedWhenPaused = 0;

// Typing correctness + live speed update
if (quoteInputElement) {
    quoteInputElement.addEventListener('input', () => {
        const arrayQuote = quoteDisplayElement.querySelectorAll('span');
        const arrayValue = quoteInputElement.value.split('');
        let correct = true;

        arrayQuote.forEach((characterSpan, index) => {
            const character = arrayValue[index];
            if (character == null) {
                characterSpan.classList.remove('incorrect', 'correct');
                correct = false;
            } else if (character === characterSpan.innerText) {
                characterSpan.classList.add('correct');
                characterSpan.classList.remove('incorrect');
            } else {
                characterSpan.classList.remove('correct');
                characterSpan.classList.add('incorrect');
                correct = false;
            }
        });

        updateSpeed();

        // When quote is fully correct, show final speed and load new quote
        if (correct) {
            showFinalSpeed();
            renderNewQuote();
        }
    });

    quoteInputElement.addEventListener('paste', (e) => e.preventDefault());
    quoteInputElement.addEventListener('copy', (e) => e.preventDefault());
    quoteInputElement.addEventListener('cut', (e) => e.preventDefault());
}
// get the random text for the next round 
function getRandomQuote() {
    return fetch(randomQuoteApiUrl)
        .then(response => response.json())
        .then(data => data.content);
}

async function renderNewQuote() {
    const quote = await getRandomQuote();
    quoteDisplayElement.innerHTML = '';
    quote.split('').forEach(character => {
        const characterSpan = document.createElement('span');
        characterSpan.innerText = character;
        quoteDisplayElement.appendChild(characterSpan);
    });
    quoteInputElement.value = '';
    elapsedWhenPaused = 0;
    startTimerFresh();
}

function startTimerFresh() {
    clearInterval(timerInterval);
    isPaused = false;
    startTime = new Date();
    timerElement.innerText = 0;
    timerInterval = setInterval(() => {
        if (!isPaused) {
            timerElement.innerText = getTimerTime();
        }
    }, 1000);
}

function getTimerTime() {
    const delta = Math.floor((new Date() - startTime) / 1000);
    return elapsedWhenPaused + delta;
}

function pauseTimer() {
    if (isPaused) return;
    isPaused = true;
    elapsedWhenPaused = getTimerTime();
    clearInterval(timerInterval);
    quoteDisplayElement.style.opacity = 0.5;
    quoteInputElement.blur();
}

function resumeTimer() {
    if (!isPaused) return;
    isPaused = false;
    startTime = new Date();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerElement.innerText = getTimerTime();
    }, 1000);
    quoteDisplayElement.style.opacity = 1;
}

// Pause when input loses focus
if (quoteInputElement) {
    quoteInputElement.addEventListener('blur', pauseTimer);
    // Resume when input gains focus
    quoteInputElement.addEventListener('focus', resumeTimer);
}

// Pause button
if (pauseBtn) {
    pauseBtn.addEventListener('click', pauseTimer);
}

// Speed calculation
function updateSpeed() {
    const typedCharacters = quoteInputElement.value.length;
    const elapsed = getTimerTime();
    if (elapsed > 0) {
        const cps = (typedCharacters / elapsed).toFixed(2);
        const wpm = ((typedCharacters / 5) / (elapsed / 60)).toFixed(2);
        speedElement.innerText = `Speed: ${cps} chars/sec | ${wpm} WPM`;
    }
}

function showFinalSpeed() {
    const typedCharacters = quoteInputElement.value.length;
    const elapsed = getTimerTime();
    const cps = (typedCharacters / elapsed).toFixed(2);
    const wpm = ((typedCharacters / 5) / (elapsed / 60)).toFixed(2);
    
    // Save this round to history
    const roundData = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        wpm: parseFloat(wpm),
        cps: parseFloat(cps),
        time: elapsed,
        characters: typedCharacters,
        quote: quoteDisplayElement.innerText.substring(0, 50) + '...'
    };
    
    roundHistory.unshift(roundData); // Add to beginning
    localStorage.setItem('roundHistory', JSON.stringify(roundHistory));
    
    // Update history display
    displayRoundHistory();
    
    alert(`🎯 Round Complete!\n\nSpeed: ${cps} chars/sec\n${wpm} WPM\nTime: ${elapsed}s`);
}

// Initialize typing game if on index page
if (quoteDisplayElement) {
    renderNewQuote();
    displayRoundHistory();
}

// Function to display round history
function displayRoundHistory() {
    if (!roundHistoryElement) return;
    
    if (roundHistory.length === 0) {
        roundHistoryElement.innerHTML = '<p class="no-history">No rounds yet. Start typing to begin!</p>';
        return;
    }
    
    roundHistoryElement.innerHTML = roundHistory.map((round, index) => `
        <div class="history-item slide-up" style="--delay: ${index * 0.1}s">
            <div class="history-rank">${index + 1}</div>
            <div class="history-details">
                <div class="history-stats">
                    <span class="stat-badge">📊 ${round.wpm} WPM</span>
                    <span class="stat-badge">⚡ ${round.cps} CPS</span>
                    <span class="stat-badge">⏱️ ${round.time}s</span>
                </div>
                <div class="history-quote">"${round.quote}"</div>
                <div class="history-time">${round.timestamp}</div>
            </div>
        </div>
    `).join('');
}

// Restart button functionality
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        // Confirm restart
        if (quoteInputElement.value.length > 0) {
            if (!confirm('Discard current round and restart?')) {
                return;
            }
        }
        renderNewQuote();
    });
}