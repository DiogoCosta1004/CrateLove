import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Configuração do Firebase
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

/* ===== SELETORES DE ELEMENTOS ===== */
const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const navMenu = document.querySelector(".nav-menu");
const menuBtn = document.querySelector(".fa-bars");

/* ===== FUNÇÕES DE UI (FEEDBACK E LOADING) ===== */

// Função para exibir notificações (Toast)
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return; // Segurança caso o container não exista no HTML

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);

    // Remove o toast após 3 segundos
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Função para gerenciar estado de carregamento do botão
function setBtnLoading(btn, isLoading) {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.oldText = btn.innerHTML; // Salva o texto original
        btn.innerHTML = `<span class="spinner"></span> Processando...`;
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.oldText || btn.innerHTML;
    }
}

/* ===== CONTROLE DOS MODAIS E MENU ===== */

menuBtn.onclick = () => navMenu.classList.toggle("show");

document.querySelector(".login").onclick = () => loginModal.classList.add("show");

document.querySelector(".close-login").onclick = () => {
    loginModal.classList.remove("show");
};

document.querySelector(".close-register").onclick = () => {
    registerModal.classList.remove("show");
};

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

/* ===== LÓGICA DE LOGIN ===== */

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("loginEmail");
    const passInput = document.getElementById("loginPassword");
    const btn = e.target.querySelector("button");

    // Reset de estilos
    emailInput.classList.remove("input-error");
    passInput.classList.remove("input-error");

    setBtnLoading(btn, true);

    try {
        await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
        showToast("Login realizado com sucesso!", "success");
        loginModal.classList.remove("show");
    } catch (err) {
        passInput.classList.add("input-error");
        showToast("E-mail ou senha inválidos.", "error");
        console.error(err);
    } finally {
        setBtnLoading(btn, false);
    }
});

/* ===== LÓGICA DE CADASTRO ===== */

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("registerEmail");
    const passInput = document.getElementById("registerPassword");
    const btn = e.target.querySelector("button");

    // Validação de lado do cliente (Mínimo 6 caracteres)
    if (passInput.value.length < 6) {
        passInput.classList.add("input-error");
        showToast("A senha deve ter no mínimo 6 caracteres.", "error");
        return;
    }

    setBtnLoading(btn, true);

    try {
        await createUserWithEmailAndPassword(auth, emailInput.value, passInput.value);
        showToast("Conta criada com sucesso!", "success");
        registerModal.classList.remove("show");
    } catch (err) {
        showToast("Erro ao cadastrar: " + err.message, "error");
    } finally {
        setBtnLoading(btn, false);
    }
});

/* ===== GOOGLE AUTH ===== */

const loginWithGoogle = async (e) => {
    const btn = e.currentTarget;
    setBtnLoading(btn, true);

    try {
        await signInWithPopup(auth, provider);
        showToast("Conectado com Google!", "success");
        loginModal.classList.remove("show");
        registerModal.classList.remove("show");
    } catch (err) {
        showToast("Erro na autenticação Google.", "error");
    } finally {
        setBtnLoading(btn, false);
    }
};

document.getElementById("googleLogin").onclick = loginWithGoogle;
document.getElementById("googleRegister").onclick = loginWithGoogle;