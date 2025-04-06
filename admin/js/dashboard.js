// Global variables
let selectedUserId = null;
let selectedRequest = null;

// Check admin authentication
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login.html';
    }
    return token;
}

// Fetch top-up requests
async function fetchTopupRequests() {
    const token = checkAuth();
    try {
        const response = await fetch('/api/admin/topup-requests', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const requests = await response.json();
            displayRequests(requests);
        } else {
            throw new Error('Failed to fetch requests');
        }
    } catch (error) {
        console.error('Error fetching requests:', error);
        alert('Failed to load top-up requests');
    }
}

// Display requests in sidebar
function displayRequests(requests) {
    const listContainer = document.getElementById('userRequestsList');
    listContainer.innerHTML = '';
    
    requests.forEach(request => {
        const requestElement = document.createElement('div');
        requestElement.className = 'request-item p-3 border border-black rounded-md cursor-pointer hover:bg-gray-50';
        requestElement.onclick = () => selectRequest(request);
        
        const timestamp = new Date(request.created_at).toLocaleString('id-ID');
        
        requestElement.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="font-medium">${request.user.name}</span>
                <span class="text-sm text-gray-500">${request.status}</span>
            </div>
            <p class="text-sm text-gray-600">${request.package_type} Tokens</p>
            <p class="text-xs text-gray-500">${timestamp}</p>
        `;
        
        listContainer.appendChild(requestElement);
    });
}

// Select a request to display
function selectRequest(request) {
    selectedRequest = request;
    selectedUserId = request.user_id;
    
    // Update user info
    document.getElementById('selectedUserName').textContent = request.user.name;
    document.getElementById('selectedUserEmail').textContent = request.user.email;
    
    // Display chat history
    displayChatHistory(request);
}

// Display chat history for selected request
function displayChatHistory(request) {
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.innerHTML = '';
    
    // Add initial request message
    const requestMessage = document.createElement('div');
    requestMessage.className = 'flex items-start space-x-3';
    requestMessage.innerHTML = `
        <div class="flex-shrink-0">
            <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User">
        </div>
        <div class="flex-1">
            <div class="bg-gray-100 p-3 rounded-lg">
                <p class="text-sm font-medium">Top-up Request:</p>
                <p class="text-sm">Package: ${request.package_type} Tokens</p>
                <p class="text-sm">Amount: Rp ${(parseInt(request.package_type) * 500).toLocaleString('id-ID')}</p>
                ${request.proof_url ? `<img src="${request.proof_url}" alt="Bukti Transfer" class="mt-2 max-w-xs rounded">` : ''}
            </div>
            <p class="text-xs text-gray-500 mt-1">${new Date(request.created_at).toLocaleString('id-ID')}</p>
        </div>
    `;
    chatMessages.appendChild(requestMessage);
    
    // Add any admin responses
    if (request.admin_messages) {
        request.admin_messages.forEach(message => {
            const adminMessage = document.createElement('div');
            adminMessage.className = 'flex items-start justify-end space-x-3';
            adminMessage.innerHTML = `
                <div class="flex-1">
                    <div class="bg-black text-white p-3 rounded-lg">
                        <p class="text-sm">${message.content}</p>
                    </div>
                    <p class="text-xs text-gray-500 mt-1 text-right">${new Date(message.created_at).toLocaleString('id-ID')}</p>
                </div>
                <div class="flex-shrink-0">
                    <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Admin">
                </div>
            `;
            chatMessages.appendChild(adminMessage);
        });
    }
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send admin message
async function sendAdminMessage() {
    if (!selectedRequest) {
        alert('Please select a request first');
        return;
    }
    
    const input = document.getElementById('adminMessage');
    const message = input.value.trim();
    if (!message) return;
    
    const token = checkAuth();
    try {
        const response = await fetch(`/api/admin/topup-requests/${selectedRequest.id}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message })
        });
        
        if (response.ok) {
            // Clear input
            input.value = '';
            
            // Add message to chat
            const chatMessages = document.querySelector('.chat-messages');
            const adminMessage = document.createElement('div');
            adminMessage.className = 'flex items-start justify-end space-x-3';
            adminMessage.innerHTML = `
                <div class="flex-1">
                    <div class="bg-black text-white p-3 rounded-lg">
                        <p class="text-sm">${message}</p>
                    </div>
                    <p class="text-xs text-gray-500 mt-1 text-right">${new Date().toLocaleString('id-ID')}</p>
                </div>
                <div class="flex-shrink-0">
                    <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Admin">
                </div>
            `;
            chatMessages.appendChild(adminMessage);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            throw new Error('Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
    }
}

// Approve top-up request
async function approveTopup() {
    if (!selectedRequest) {
        alert('Please select a request first');
        return;
    }
    
    if (!confirm('Are you sure you want to approve this top-up request?')) {
        return;
    }
    
    const token = checkAuth();
    try {
        const response = await fetch(`/api/admin/topup-requests/${selectedRequest.id}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Top-up request approved successfully');
            // Refresh requests list
            fetchTopupRequests();
        } else {
            throw new Error('Failed to approve request');
        }
    } catch (error) {
        console.error('Error approving request:', error);
        alert('Failed to approve request');
    }
}

// Reject top-up request
async function rejectTopup() {
    if (!selectedRequest) {
        alert('Please select a request first');
        return;
    }
    
    const reason = prompt('Please enter a reason for rejection:');
    if (reason === null) return; // User cancelled
    
    const token = checkAuth();
    try {
        const response = await fetch(`/api/admin/topup-requests/${selectedRequest.id}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason })
        });
        
        if (response.ok) {
            alert('Top-up request rejected');
            // Refresh requests list
            fetchTopupRequests();
        } else {
            throw new Error('Failed to reject request');
        }
    } catch (error) {
        console.error('Error rejecting request:', error);
        alert('Failed to reject request');
    }
}

// Toggle mobile sidebar
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.md\\:flex-shrink-0');
    sidebar.classList.toggle('hidden');
}

// Logout function
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    fetchTopupRequests();
    
    // Add enter key handler for message input
    const messageInput = document.getElementById('adminMessage');
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAdminMessage();
        }
    });
    
    // Set up WebSocket connection for real-time updates
    const socket = new WebSocket('ws://your-websocket-server');
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.type === 'new_topup_request') {
            // Refresh requests list
            fetchTopupRequests();
        }
    };
});