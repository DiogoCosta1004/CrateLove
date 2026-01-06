import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const db = getFirestore(app);

let fotoBase64 = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }
    carregarDadosPerfil(user.uid);
});

async function carregarDadosPerfil(uid) {
    const docRef = doc(db, "usuarios", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById("editFirstName").value = data.nome || "";
        document.getElementById("editLastName").value = data.sobrenome || "";
        document.getElementById("editBio").value = data.bio || "";
        document.getElementById("editGender").value = data.genero || "homem";
        document.getElementById("editInterest").value = data.interesse || "todos";
        if (data.foto) document.getElementById("currentPhoto").src = data.foto;
        
        fotoBase64 = data.foto;
    }
}

// Lógica de upload de nova foto
const photoDiv = document.getElementById("profilePreview");
const fileInput = document.getElementById("newPhoto");

photoDiv.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 400;
            const scale = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            fotoBase64 = canvas.toDataURL('image/jpeg', 0.7);
            document.getElementById("currentPhoto").src = fotoBase64;
        };
    };
    reader.readAsDataURL(file);
};

// Salvar alterações
// Salvar alterações
document.getElementById("editProfileForm").onsubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const btn = e.target.querySelector("button");

    // Bloqueia o botão para evitar múltiplos envios
    btn.disabled = true;
    btn.innerText = "Salvando...";

    try {
        await updateDoc(doc(db, "usuarios", user.uid), {
            nome: document.getElementById("editFirstName").value,
            sobrenome: document.getElementById("editLastName").value,
            bio: document.getElementById("editBio").value,
            genero: document.getElementById("editGender").value,
            interesse: document.getElementById("editInterest").value,
            foto: fotoBase64 // Esta variável deve estar definida no escopo global do seu perfil-script.js
        });

        // IMPORTANTE: Resetamos a variável 'alterado' aqui
        alterado = false; 
        
        alert("Perfil atualizado com sucesso!");
    } catch (error) {
        console.error(error);
        alert("Erro ao atualizar perfil.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Salvar Alterações";
    }
};