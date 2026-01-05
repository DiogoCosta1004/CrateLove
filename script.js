import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA5HIbPvUH0TOK77orGcVrpbno7tdFA1Fg",
    authDomain: "datingproject-f3720.firebaseapp.com",
    projectId: "datingproject-f3720",
    storageBucket: "datingproject-f3720.firebasestorage.app",
    messagingSenderId: "5302696540",
    appId: "1:5302696540:web:42959e5db2ffc03a090499"
};

let fotoBase64 = null;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

/* ===== SELETORES DE ELEMENTOS ===== */
const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const profileModal = document.getElementById("profileModal");
const navMenu = document.querySelector(".nav-menu");
const menuBtn = document.querySelector(".fa-bars");
const authContainer = document.getElementById("auth-buttons");

/* ===== FUNÇÕES DE UI (FEEDBACK) ===== */

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function setBtnLoading(btn, isLoading) {
    if (isLoading) {
        btn.disabled = true;
        btn.dataset.oldText = btn.innerHTML;
        btn.innerHTML = `<span class="spinner"></span> Carregando...`;
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.oldText || btn.innerHTML;
    }
}

/* ===== MONITOR DE ESTADO DO USUÁRIO ===== */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Busca dados do perfil para verificar se está completo
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        
        // Se já completou o perfil, redireciona para a Home automaticamente
        if (docSnap.exists() && docSnap.data().completouPerfil) {
            window.location.href = "home.html";
        }

        let nomeUsuario = docSnap.exists() ? docSnap.data().nome : "Usuário";
        
        // Atualiza a interface do Header
        if(authContainer) {
            authContainer.innerHTML = `
                <span style="margin-left: 20px; font-weight: 600;">Olá, ${nomeUsuario}!</span>
                <button type="button" class="details-btn" id="logoutBtn" style="padding: 10px 20px; margin-left: 15px;">Sair</button>
            `;

            document.getElementById("logoutBtn").onclick = () => {
                auth.signOut().then(() => {
                    showToast("Você saiu com sucesso!");
                    window.location.reload();
                });
            };
        }
    } else {
        // Se deslogado, exibe botão Entrar
        if(authContainer) {
            authContainer.innerHTML = `<button type="button" class="login" id="loginBtn">Entrar</button>`;
            document.getElementById("loginBtn").onclick = () => loginModal.classList.add("show");
        }
    }
});

/* ===== LÓGICA DE PASSOS DO PERFIL (MODAL) ===== */
const nextBtn = document.querySelector(".next-step");
if(nextBtn) {
    nextBtn.onclick = () => {
        if(!document.getElementById("firstName").value) {
            showToast("Por favor, preencha seu nome", "error");
            return;
        }
        document.querySelectorAll(".setup-step")[0].classList.remove("active");
        document.querySelectorAll(".setup-step")[1].classList.add("active");
        document.getElementById("setupProgress").style.width = "100%";
    };
}

/* ===== LÓGICA DE LOGIN ===== */
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPassword").value;
    const btn = e.target.querySelector("button");

    setBtnLoading(btn, true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // Verifica se o perfil existe para decidir onde mandar o usuário
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        loginModal.classList.remove("show");

        if (docSnap.exists()) {
            window.location.href = "home.html";
        } else {
            showToast("Complete seu perfil!");
            profileModal.classList.add("show");
        }
    } catch (err) {
        showToast("E-mail ou senha incorretos", "error");
    } finally {
        setBtnLoading(btn, false);
    }
});

/* ===== LÓGICA DE CADASTRO ===== */
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("registerEmail").value;
    const pass = document.getElementById("registerPassword").value;
    const btn = e.target.querySelector("button");

    if (pass.length < 6) {
        showToast("A senha deve ter 6+ caracteres", "error");
        return;
    }

    setBtnLoading(btn, true);

    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        showToast("Conta criada com sucesso!", "success");
        registerModal.classList.remove("show");
        profileModal.classList.add("show");
    } catch (err) {
        showToast("Erro ao cadastrar: " + err.message, "error");
    } finally {
        setBtnLoading(btn, false);
    }
});

/* ===== LÓGICA DE UPLOAD DE FOTO (PREVIEW) ===== */
/* ===== LÓGICA DE UPLOAD COM REDIMENSIONAMENTO (CANVAS) ===== */
const fotoInput = document.getElementById("profilePhoto");
const photoPreview = document.getElementById("photoPreview");

if (fotoInput) {
    fotoInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;

            img.onload = function() {
                // Criamos o editor invisível
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Definimos o tamanho padrão (Ex: 400px de largura)
                const maxWidth = 400;
                const scale = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scale;

                // Desenhamos a imagem no novo tamanho
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Convertemos para Base64 com compressão (0.7 = 70% de qualidade)
                fotoBase64 = canvas.toDataURL('image/jpeg', 0.7);

                // Atualizamos o preview na tela
                photoPreview.innerHTML = `<img src="${fotoBase64}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                showToast("Foto processada com sucesso!");
            };
        };
        reader.readAsDataURL(file);
    });
}

// Opcional: Clique no círculo também abre o seletor de arquivos
photoPreview.onclick = () => fotoInput.click();

/* ===== SALVAR DADOS NO FIRESTORE E IR PARA HOME ===== */
document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("saveProfile");
    const user = auth.currentUser;

    const profileData = {
        uid: user.uid,
        nome: document.getElementById("firstName").value,
        sobrenome: document.getElementById("lastName").value,
        nascimento: document.getElementById("birthDate").value,
        bio: document.getElementById("userBio").value,
        genero: document.getElementById("userGender").value,
        interesse: document.getElementById("userInterest").value,
        // Salvamos o código da imagem aqui
        foto: fotoBase64 || "https://via.placeholder.com/400x500?text=Sem+Foto",
        completouPerfil: true,
        dataCriacao: new Date()
    };

    setBtnLoading(btn, true);

    try {
        await setDoc(doc(db, "usuarios", user.uid), profileData);
        showToast("Perfil criado com sucesso!", "success");
        setTimeout(() => { window.location.href = "home.html"; }, 1500);
    } catch (err) {
        showToast("Erro ao salvar perfil", "error");
    } finally {
        setBtnLoading(btn, false);
    }
});

/* ===== CONTROLE DOS MODAIS E MENU ===== */
if(menuBtn) menuBtn.onclick = () => navMenu.classList.toggle("show");

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

/* ===== GOOGLE AUTH ===== */
const loginWithGoogle = async (e) => {
    const btn = e.currentTarget;
    setBtnLoading(btn, true);
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        loginModal.classList.remove("show");
        registerModal.classList.remove("show");

        if (!docSnap.exists()) {
            profileModal.classList.add("show");
        } else {
            window.location.href = "home.html";
        }
    } catch (err) {
        showToast("Erro na autenticação Google.", "error");
    } finally {
        setBtnLoading(btn, false);
    }
};

document.getElementById("googleLogin").onclick = loginWithGoogle;
document.getElementById("googleRegister").onclick = loginWithGoogle;
