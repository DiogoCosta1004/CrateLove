import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA5HIbPvUH0TOK77orGcVrpbno7tdFA1Fg",
  authDomain: "datingproject-f3720.firebaseapp.com",
  projectId: "datingproject-f3720",
  storageBucket: "datingproject-f3720.firebasestorage.app",
  messagingSenderId: "5302696540",
  appId: "1:5302696540:web:42959e5db2ffc03a090499"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Seletores de Elementos
const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const navMenu = document.querySelector(".nav-menu");
const menuBtn = document.querySelector(".fa-bars");

/* ===== MENU MOBILE ===== */
menuBtn.onclick = () => navMenu.classList.toggle("show");

/* ===== LÓGICA DOS MODAIS ===== */
document.querySelector(".login").onclick = () => loginModal.classList.add("show");
document.querySelector(".close-login").onclick = () => loginModal.classList.remove("show");
document.querySelector(".close-register").onclick = () => registerModal.classList.remove("show");

document.getElementById("openRegister").onclick = (e) => {
  e.preventDefault();
  loginModal.classList.remove("show");
  registerModal.classList.add("show");
};

document.getElementById("openLogin").onclick = (e) => {
  e.preventDefault();
  registerModal.classList.remove("show");
  loginModal.classList.add("show");
};

/* ===== LOGIN EMAIL ===== */
document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  // Capturando os valores corretamente
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPassword").value;

  signInWithEmailAndPassword(auth, email, pass)
    .then(() => {
      alert("Login realizado com sucesso!");
      loginModal.classList.remove("show");
    })
    .catch(err => alert("Erro: " + err.message));
});

/* ===== CADASTRO EMAIL ===== */
document.getElementById("registerForm").addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("registerEmail").value;
  const pass = document.getElementById("registerPassword").value;

  createUserWithEmailAndPassword(auth, email, pass)
    .then(() => {
      alert("Conta criada com sucesso!");
      registerModal.classList.remove("show");
    })
    .catch(err => alert("Erro: " + err.message));
});

/* ===== GOOGLE AUTH ===== */
const loginWithGoogle = () => {
  signInWithPopup(auth, provider)
    .then(() => {
      alert("Sucesso com Google!");
      loginModal.classList.remove("show");
      registerModal.classList.remove("show");
    })
    .catch(err => alert(err.message));
};

document.getElementById("googleLogin").onclick = loginWithGoogle;
document.getElementById("googleRegister").onclick = loginWithGoogle;