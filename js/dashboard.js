// Global variables
let selectedPackage = null;
let uploadedProof = null;

// Toggle mobile sidebar
function toggleMobileSidebar() {
    const sidebar = document.getElementById('mobileSidebar');
    sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
}

// Switch between chat and top-up tabs
function switchTab(tab) {
    const chatSection = document.getElementById('chatSection');
    const topupSection = document.getElementById('topupSection');
    const chatTab = document.querySelector('.chat-tab');
    const topupTab = document.querySelector('.topup-tab');

    if (tab === 'chat') {
        chatSection.classList.remove('hidden');
        topupSection.classList.add('hidden');
        chatTab.classList.add('bg-black', 'text-white');
        chatTab.classList.remove('text-gray-600', 'hover:bg-gray-50');
        topupTab.classList.remove('bg-black', 'text-white');
        topupTab.classList.add('text-gray-600', 'hover:bg-gray-50');
    } else {
        chatSection.classList.add('hidden');
        topupSection.classList.remove('hidden');
        topupTab.classList.add('bg-black', 'text-white');
        topupTab.classList.remove('text-gray-600', 'hover:bg-gray-50');
        chatTab.classList.remove('bg-black', 'text-white');
        chatTab.classList.add('text-gray-600', 'hover:bg-gray-50');
    }

    // Close mobile sidebar after tab switch
    if (window.innerWidth < 768) {
        toggleMobileSidebar();
    }
}

// Handle package selection
function selectPackage(amount) {
    selectedPackage = amount;
    // Reset custom amount input
    document.getElementById('customTokenAmount').value = '';
    document.getElementById('customPrice').textContent = 'Rp 0';
    
    // Highlight selected package
    document.querySelectorAll('.package-card').forEach(card => {
        card.classList.remove('bg-gray-50', 'border-2');
    });
    event.currentTarget.classList.add('bg-gray-50', 'border-2');
}

// Calculate custom price
function calculateCustomPrice() {
    const input = document.getElementById('customTokenAmount');
    const priceDisplay = document.getElementById('customPrice');
    const amount = parseInt(input.value);
    
    if (amount >= 50) {
        const price = amount * 500;
        priceDisplay.textContent = `Rp ${price.toLocaleString('id-ID')}`;
        selectedPackage = 'custom';
    } else {
        priceDisplay.textContent = 'Rp 0';
        selectedPackage = null;
    }
}

// Copy account numbers
function copyBankAccount() {
    navigator.clipboard.writeText(document.getElementById('bankAccount').textContent);
    alert('Nomor rekening berhasil disalin!');
}

function copyDanaAccount() {
    navigator.clipboard.writeText(document.getElementById('danaAccount').textContent);
    alert('Nomor DANA berhasil disalin!');
}

// Preview proof of transfer
function previewProof(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('proofPreview');
            preview.querySelector('img').src = e.target.result;
            preview.classList.remove('hidden');
            uploadedProof = file;
        }
        reader.readAsDataURL(file);
    }
}

// Submit top-up request
async function submitTopup() {
    if (!selectedPackage) {
        alert('Silakan pilih paket atau masukkan jumlah token yang diinginkan.');
        return;
    }
    
    if (!uploadedProof) {
        alert('Silakan upload bukti transfer.');
        return;
    }

    const spinner = document.querySelector('.loading-spinner');
    spinner.classList.add('active');

    try {
        const formData = new FormData();
        formData.append('package', selectedPackage);
        if (selectedPackage === 'custom') {
            formData.append('amount', document.getElementById('customTokenAmount').value);
        }
        formData.append('proof', uploadedProof);

        const response = await fetch('/api/token/topup', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert('Permintaan top-up berhasil dikirim! Admin akan memproses permintaan Anda.');
            // Reset form
            document.getElementById('proofFile').value = '';
            document.getElementById('proofPreview').classList.add('hidden');
            document.getElementById('customTokenAmount').value = '';
            document.getElementById('customPrice').textContent = 'Rp 0';
            selectedPackage = null;
            uploadedProof = null;
        } else {
            throw new Error('Gagal mengirim permintaan top-up');
        }
    } catch (error) {
        alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
        spinner.classList.remove('active');
    }
}

// Chat functionality
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatMessages = document.querySelector('.chat-messages');
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message flex items-end justify-end';
    userMessage.innerHTML = `
        <div class="mr-3">
            <div class="bg-black text-white p-3 rounded-lg">
                <p class="text-sm">${message}</p>
            </div>
            <p class="text-xs text-gray-500 mt-1 text-right">You</p>
        </div>
        <div class="flex-shrink-0">
            <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User">
        </div>
    `;
    chatMessages.appendChild(userMessage);
    
    // Clear input
    input.value = '';
    
    // Show loading spinner
    const spinner = document.createElement('div');
    spinner.className = 'chat-message flex items-start';
    spinner.innerHTML = `
        <div class="flex-shrink-0">
            <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="AI">
        </div>
        <div class="ml-3">
            <div class="bg-gray-100 p-3 rounded-lg">
                <div class="loading-spinner active"></div>
            </div>
        </div>
    `;
    chatMessages.appendChild(spinner);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ message })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Remove loading spinner
            chatMessages.removeChild(spinner);
            
            // Add AI response
            const aiMessage = document.createElement('div');
            aiMessage.className = 'chat-message flex items-start';
            aiMessage.innerHTML = `
                <div class="flex-shrink-0">
                    <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="AI">
                </div>
                <div class="ml-3">
                    <div class="bg-gray-100 p-3 rounded-lg">
                        <p class="text-sm text-gray-900">${data.response}</p>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">AI Assistant</p>
                </div>
            `;
            chatMessages.appendChild(aiMessage);
            
            // Update token counter
            const tokenCounter = document.getElementById('tokenCounter');
            tokenCounter.textContent = parseInt(tokenCounter.textContent) - data.tokensUsed;
        } else {
            throw new Error('Failed to get response');
        }
    } catch (error) {
        // Remove loading spinner
        chatMessages.removeChild(spinner);
        
        // Add error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'chat-message flex items-start';
        errorMessage.innerHTML = `
            <div class="flex-shrink-0">
                <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="AI">
            </div>
            <div class="ml-3">
                <div class="bg-red-100 p-3 rounded-lg">
                    <p class="text-sm text-red-900">Maaf, terjadi kesalahan. Silakan coba lagi.</p>
                </div>
                <p class="text-xs text-gray-500 mt-1">AI Assistant</p>
            </div>
        `;
        chatMessages.appendChild(errorMessage);
    }
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle image upload
function uploadImage() {
    document.getElementById('imageInput').click();
}

// Handle image file selection
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const chatMessages = document.querySelector('.chat-messages');
    
    // Add image message
    const imageMessage = document.createElement('div');
    imageMessage.className = 'chat-message flex items-end justify-end';
    imageMessage.innerHTML = `
        <div class="mr-3">
            <div class="bg-black text-white p-3 rounded-lg">
                <img src="${URL.createObjectURL(file)}" alt="Uploaded image" class="max-w-xs rounded">
            </div>
            <p class="text-xs text-gray-500 mt-1 text-right">You</p>
        </div>
        <div class="flex-shrink-0">
            <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User">
        </div>
    `;
    chatMessages.appendChild(imageMessage);
    
    // Show loading spinner
    const spinner = document.createElement('div');
    spinner.className = 'chat-message flex items-start';
    spinner.innerHTML = `
        <div class="flex-shrink-0">
            <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="AI">
        </div>
        <div class="ml-3">
            <div class="bg-gray-100 p-3 rounded-lg">
                <div class="loading-spinner active"></div>
            </div>
        </div>
    `;
    chatMessages.appendChild(spinner);
    
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/chat/image', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Remove loading spinner
            chatMessages.removeChild(spinner);
            
            // Add AI response
            const aiMessage = document.createElement('div');
            aiMessage.className = 'chat-message flex items-start';
            aiMessage.innerHTML = `
                <div class="flex-shrink-0">
                    <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="AI">
                </div>
                <div class="ml-3">
                    <div class="bg-gray-100 p-3 rounded-lg">
                        <p class="text-sm text-gray-900">${data.response}</p>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">AI Assistant</p>
                </div>
            `;
            chatMessages.appendChild(aiMessage);
            
            // Update token counter
            const tokenCounter = document.getElementById('tokenCounter');
            tokenCounter.textContent = parseInt(tokenCounter.textContent) - data.tokensUsed;
        } else {
            throw new Error('Failed to process image');
        }
    } catch (error) {
        // Remove loading spinner
        chatMessages.removeChild(spinner);
        
        // Add error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'chat-message flex items-start';
        errorMessage.innerHTML = `
            <div class="flex-shrink-0">
                <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="AI">
            </div>
            <div class="ml-3">
                <div class="bg-red-100 p-3 rounded-lg">
                    <p class="text-sm text-red-900">Maaf, terjadi kesalahan dalam memproses gambar. Silakan coba lagi.</p>
                </div>
                <p class="text-xs text-gray-500 mt-1">AI Assistant</p>
            </div>
        `;
        chatMessages.appendChild(errorMessage);
    }
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    // Add enter key handler for chat input
    const chatInput = document.getElementById('chatInput');
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});