// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  onValue, 
  serverTimestamp, 
  update, 
  remove, 
  query, 
  orderByChild, 
  equalTo 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytesResumable, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzYZMxqNmnLMGYnCyiJYPg2MbxZMt0co0",
  authDomain: "osama-91b95.firebaseapp.com",
  databaseURL: "https://osama-91b95-default-rtdb.firebaseio.com",
  projectId: "osama-91b95",
  storageBucket: "osama-91b95.appspot.com",
  messagingSenderId: "118875905722",
  appId: "1:118875905722:web:200bff1bd99db2c1caac83",
  measurementId: "G-LEM5PVPJZC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// عناصر DOM
const homePage = document.getElementById('home-page');
const authPage = document.getElementById('auth-page');
const profilePage = document.getElementById('profile-page');
const messagesPage = document.getElementById('messages-page');
const postDetailPage = document.getElementById('post-detail-page');
const ordersPage = document.getElementById('orders-page');
const orderDetailPage = document.getElementById('order-detail-page');
const loadingOverlay = document.getElementById('loading-overlay');
const uploadProgress = document.getElementById('upload-progress');

const authMessage = document.getElementById('auth-message');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const buyNowBtn = document.getElementById('buy-now-btn');

const postsContainer = document.getElementById('posts-container');
const userInfo = document.getElementById('user-info');
const postDetailContent = document.getElementById('post-detail-content');
const ordersContainer = document.getElementById('orders-container');
const orderDetailContent = document.getElementById('order-detail-content');

const profileIcon = document.getElementById('profile-icon');
const messagesIcon = document.getElementById('messages-icon');
const addPostIcon = document.getElementById('add-post-icon');
const supportIcon = document.getElementById('support-icon');
const moreIcon = document.getElementById('more-icon');
const homeIcon = document.getElementById('home-icon');
const closeAuthBtn = document.getElementById('close-auth');
const closeProfileBtn = document.getElementById('close-profile');
const closeMessagesBtn = document.getElementById('close-messages');
const closePostDetailBtn = document.getElementById('close-post-detail');
const closeOrdersBtn = document.getElementById('close-orders');
const closeOrderDetailBtn = document.getElementById('close-order-detail');

// عناصر نظام الرسائل
const usersList = document.getElementById('users-list');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const currentChatUser = document.getElementById('current-chat-user');

// عناصر صفحة الطلبات
const filterBtns = document.querySelectorAll('.filter-btn');
const approveOrderBtn = document.getElementById('approve-order-btn');
const rejectOrderBtn = document.getElementById('reject-order-btn');
const chatWithBuyerBtn = document.getElementById('chat-with-buyer-btn');
const chatWithSellerBtn = document.getElementById('chat-with-seller-btn');

// متغيرات النظام
let activeUserId = null;
let userMessages = {};
let userUnreadCounts = {};
let userLastMessageTime = {};
let currentUserData = null;
let messagesListener = null;
let currentPost = null;
let adminUsers = [];
let currentOrders = [];
let currentOrder = null;
let ordersListener = null;

// تحميل المنشورات عند بدء التحميل
document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  loadAdminUsers();
  addAdminIconToFooter();
});

// استمع لتغير حالة المستخدم
onAuthStateChanged(auth, user => {
  if (user) {
    // تحميل بيانات المستخدم الحالي
    const userRef = ref(database, 'users/' + user.uid);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        currentUserData = snapshot.val();
        currentUserData.uid = user.uid;
        
        // تحديث واجهة المستخدم بناءً على الدور
        if (currentUserData.isAdmin) {
          document.getElementById('admin-icon').style.display = 'flex';
        }
      }
    });
  } else {
    // إخفاء أيقونة الإدارة إذا لم يكن المستخدم مسجلاً
    document.getElementById('admin-icon').style.display = 'none';
  }
});

// تحميل المشرفين
function loadAdminUsers() {
  const usersRef = ref(database, 'users');
  onValue(usersRef, (snapshot) => {
    adminUsers = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.isAdmin) {
          adminUsers.push({
            id: childSnapshot.key,
            ...userData
          });
        }
      });
    }
  });
}

// تحميل المنشورات للجميع
function loadPosts() {
  const postsRef = ref(database, 'posts');
  onValue(postsRef, (snapshot) => {
    postsContainer.innerHTML = '';
    
    if (!snapshot.exists()) {
      postsContainer.innerHTML = '<div class="no-posts">لا توجد منشورات بعد</div>';
      return;
    }
    
    const posts = [];
    snapshot.forEach((childSnapshot) => {
      const post = childSnapshot.val();
      posts.push(post);
    });
    
    // ترتيب المنشورات من الأحدث إلى الأقدم
    posts.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt - a.createdAt;
      }
      return 0;
    });
    
    // عرض المنشورات
    posts.forEach(post => {
      const postCard = createPostCard(post);
      postsContainer.appendChild(postCard);
    });
  });
}

// إنشاء بطاقة منشور
function createPostCard(post) {
  const postCard = document.createElement('div');
  postCard.className = 'post-card';
  
  postCard.innerHTML = `
    <div class="post-image">
      ${post.imageUrl ? 
        `<img src="${post.imageUrl}" alt="${post.title}" loading="lazy">` : 
        `<i class="fas fa-image"></i>`}
    </div>
    <div class="post-content">
      <h3 class="post-title">${post.title}</h3>
      <p class="post-description">${post.description}</p>
      <div class="post-meta">
        <span class="post-price">${post.price || 'غير محدد'}</span>
        <span class="post-author">
          <i class="fas fa-user"></i> ${post.authorName || 'مستخدم'}
        </span>
      </div>
    </div>
  `;
  
  postCard.addEventListener('click', () => {
    showPostDetail(post);
  });
  
  return postCard;
}

// عرض تفاصيل المنشور
function showPostDetail(post) {
  currentPost = post;
  
  postDetailContent.innerHTML = `
    <img src="${post.imageUrl || ''}" class="post-detail-image" alt="${post.title}">
    <h2 class="post-detail-title">${post.title}</h2>
    <p class="post-detail-description">${post.description}</p>
    
    <div class="post-detail-meta">
      <div class="meta-item">
        <i class="fas fa-tag"></i>
        <span>السعر: ${post.price || 'غير محدد'}</span>
      </div>
      <div class="meta-item">
        <i class="fas fa-map-marker-alt"></i>
        <span>الموقع: ${post.location || 'غير محدد'}</span>
      </div>
      <div class="meta-item">
        <i class="fas fa-phone"></i>
        <span>الهاتف: ${post.phone || 'غير محدد'}</span>
      </div>
    </div>
    
    <div class="post-detail-author">
      <div class="author-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="author-info">
        <div class="author-name">${post.authorName || 'مستخدم'}</div>
        <div class="author-contact">تواصل مع البائع</div>
      </div>
    </div>
    
    <div class="purchase-section">
      <button class="btn btn-success" id="buy-now-btn">
        <i class="fas fa-shopping-cart"></i> اشتر الآن
      </button>
    </div>
  `;
  
  // إعادة إرفاق مستمع الحدث لزر الشراء
  const newBuyNowBtn = document.getElementById('buy-now-btn');
  newBuyNowBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) {
      showPage(authPage);
      return;
    }
    
    createOrder(user.uid, post);
  });
  
  showPage(postDetailPage);
}

// زر اشتري الآن
buyNowBtn.addEventListener('click', () => {
  const user = auth.currentUser;
  if (!user) {
    showPage(authPage);
    return;
  }
  
  createOrder(user.uid, currentPost);
});

// إنشاء طلب جديد
async function createOrder(userId, post) {
  try {
    const orderData = {
      buyerId: userId,
      sellerId: post.authorId,
      postId: post.id,
      postTitle: post.title,
      postPrice: post.price || 'غير محدد',
      postImage: post.imageUrl || '',
      status: 'pending',
      createdAt: serverTimestamp()
    };
    
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    
    await set(newOrderRef, {
      ...orderData,
      id: newOrderRef.key
    });
    
    alert('تم إنشاء الطلب بنجاح! سيتم التواصل معك قريباً.');
    showPage(homePage);
  } catch (error) {
    console.error('Error creating order:', error);
    alert('حدث خطأ أثناء إنشاء الطلب. يرجى المحاولة مرة أخرى.');
  }
}

// تحميل الطلبات للإدارة
function loadOrders(filter = 'all') {
  if (!currentUserData || !currentUserData.isAdmin) return;
  
  if (ordersListener) {
    ordersListener();
  }
  
  const ordersRef = ref(database, 'orders');
  ordersListener = onValue(ordersRef, (snapshot) => {
    ordersContainer.innerHTML = '';
    currentOrders = [];
    
    if (!snapshot.exists()) {
      ordersContainer.innerHTML = '<div class="no-orders">لا توجد طلبات بعد</div>';
      return;
    }
    
    // تجميع الطلبات حسب المنشور
    const ordersByPost = {};
    
    snapshot.forEach((childSnapshot) => {
      const order = childSnapshot.val();
      order.id = childSnapshot.key;
      
      if (filter === 'all' || order.status === filter) {
        if (!ordersByPost[order.postId]) {
          ordersByPost[order.postId] = {
            postId: order.postId,
            postTitle: order.postTitle,
            postImage: order.postImage,
            orders: []
          };
        }
        ordersByPost[order.postId].orders.push(order);
        currentOrders.push(order);
      }
    });
    
    // عرض الطلبات المجمعة
    if (Object.keys(ordersByPost).length === 0) {
      ordersContainer.innerHTML = '<div class="no-orders">لا توجد طلبات</div>';
      return;
    }
    
    for (const postId in ordersByPost) {
      const postData = ordersByPost[postId];
      const orderElement = createPostOrderItem(postData);
      ordersContainer.appendChild(orderElement);
    }
  });
}

// إنشاء عنصر طلب مجمع حسب المنشور
function createPostOrderItem(postData) {
  const orderElement = document.createElement('div');
  orderElement.className = 'order-item';
  orderElement.dataset.postId = postData.postId;
  
  const pendingCount = postData.orders.filter(o => o.status === 'pending').length;
  const approvedCount = postData.orders.filter(o => o.status === 'approved').length;
  const rejectedCount = postData.orders.filter(o => o.status === 'rejected').length;
  
  orderElement.innerHTML = `
    <div class="order-header">
      <h3 class="order-title">${postData.postTitle}</h3>
      <span class="order-count">${postData.orders.length} طلب</span>
    </div>
    <div class="order-statuses">
      ${pendingCount > 0 ? `<span class="status-badge status-pending">${pendingCount} قيد الانتظار</span>` : ''}
      ${approvedCount > 0 ? `<span class="status-badge status-approved">${approvedCount} مقبول</span>` : ''}
      ${rejectedCount > 0 ? `<span class="status-badge status-rejected">${rejectedCount} مرفوض</span>` : ''}
    </div>
  `;
  
  orderElement.addEventListener('click', () => {
    showPostOrders(postData);
  });
  
  return orderElement;
}

// عرض طلبات منشور معين
function showPostOrders(postData) {
  // حفظ طلبات المنشور الحالي
  window.currentPostOrders = postData;
  
  ordersContainer.innerHTML = `
    <button class="btn back-btn" id="back-to-orders">
      <i class="fas fa-arrow-right"></i> العودة للطلبات
    </button>
    
    <div class="post-orders-header">
      <h3>${postData.postTitle}</h3>
      <p>إدارة طلبات هذا المنشور</p>
    </div>
  `;
  
  // إضافة مستمع للزر الجديد
  const backBtn = document.getElementById('back-to-orders');
  backBtn.addEventListener('click', () => {
    loadOrders(document.querySelector('.filter-btn.active').dataset.filter);
  });
  
  // عرض الطلبات الفردية
  postData.orders.forEach(order => {
    const orderElement = createIndividualOrderItem(order);
    ordersContainer.appendChild(orderElement);
  });
}

// إنشاء عنصر طلب فردي
function createIndividualOrderItem(order) {
  const orderElement = document.createElement('div');
  orderElement.className = 'order-item individual-order';
  orderElement.dataset.orderId = order.id;
  
  let statusClass = 'status-pending';
  let statusText = 'قيد الانتظار';
  
  if (order.status === 'approved') {
    statusClass = 'status-approved';
    statusText = 'مقبول';
  } else if (order.status === 'rejected') {
    statusClass = 'status-rejected';
    statusText = 'مرفوض';
  }
  
  orderElement.innerHTML = `
    <div class="order-header">
      <h3 class="order-title">طلب #${order.id.substring(0, 6)}</h3>
      <span class="order-status ${statusClass}">${statusText}</span>
    </div>
    <div class="order-meta">
      <span>${formatDate(order.createdAt)}</span>
      <span class="order-price">${order.postPrice}</span>
    </div>
  `;
  
  orderElement.addEventListener('click', () => {
    showOrderDetail(order);
  });
  
  return orderElement;
}

// عرض تفاصيل الطلب
async function showOrderDetail(order) {
  currentOrder = order;
  
  // تحميل معلومات المشتري والبائع
  const buyerRef = ref(database, 'users/' + order.buyerId);
  const sellerRef = ref(database, 'users/' + order.sellerId);
  
  let buyerData = null;
  let sellerData = null;
  
  // استخدام Promise.all لتحميل البيانات بشكل متوازي
  try {
    [buyerData, sellerData] = await Promise.all([
      new Promise(resolve => {
        onValue(buyerRef, (snapshot) => {
          resolve(snapshot.exists() ? snapshot.val() : null);
        }, { onlyOnce: true });
      }),
      new Promise(resolve => {
        onValue(sellerRef, (snapshot) => {
          resolve(snapshot.exists() ? snapshot.val() : null);
        }, { onlyOnce: true });
      })
    ]);
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  
  orderDetailContent.innerHTML = `
    <div class="order-detail-section">
      <h3>معلومات الطلب</h3>
      <div class="order-detail-item">
        <span class="order-detail-label">رقم الطلب:</span>
        <span class="order-detail-value">${order.id}</span>
      </div>
      <div class="order-detail-item">
        <span class="order-detail-label">المنشور:</span>
        <span class="order-detail-value">${order.postTitle}</span>
      </div>
      <div class="order-detail-item">
        <span class="order-detail-label">السعر:</span>
        <span class="order-detail-value">${order.postPrice}</span>
      </div>
      <div class="order-detail-item">
        <span class="order-detail-label">الحالة:</span>
        <span class="order-detail-value">
          <span class="order-status ${order.status === 'pending' ? 'status-pending' : order.status === 'approved' ? 'status-approved' : 'status-rejected'}">
            ${order.status === 'pending' ? 'قيد الانتظار' : order.status === 'approved' ? 'مقبول' : 'مرفوض'}
          </span>
        </span>
      </div>
      <div class="order-detail-item">
        <span class="order-detail-label">تاريخ الطلب:</span>
        <span class="order-detail-value">${formatDate(order.createdAt)}</span>
      </div>
    </div>
    
    <div class="order-detail-section">
      <h3>معلومات المشتري</h3>
      <div class="order-detail-item">
        <span class="order-detail-label">الاسم:</span>
        <span class="order-detail-value">${buyerData ? buyerData.name : 'غير متوفر'}</span>
      </div>
      <div class="order-detail-item">
        <span class="order-detail-label">الهاتف:</span>
        <span class="order-detail-value">${buyerData ? buyerData.phone : 'غير متوفر'}</span>
      </div>
      <div class="order-detail-item">
        <span class="order-detail-label">العنوان:</span>
        <span class="order-detail-value">${buyerData ? buyerData.address : 'غير متوفر'}</span>
      </div>
    </div>
    
    <div class="order-detail-section">
      <h3>معلومات البائع</h3>
      <div class="order-detail-item">
        <span class="order-detail-label">الاسم:</span>
        <span class="order-detail-value">${sellerData ? sellerData.name : 'غير متوفر'}</span>
      </div>
      <div class="order-detail-item">
        <span class="order-detail-label">الهاتف:</span>
        <span class="order-detail-value">${sellerData ? sellerData.phone : 'غير متوفر'}</span>
      </div>
    </div>
    
    ${order.status === 'pending' ? `
    <div class="order-actions">
      <button class="btn" id="approve-order-btn">قبول الطلب</button>
      <button class="btn btn-danger" id="reject-order-btn">رفض الطلب</button>
      <button class="btn btn-outline" id="chat-with-buyer-btn">التحدث مع المشتري</button>
      <button class="btn btn-outline" id="chat-with-seller-btn">التحدث مع البائع</button>
    </div>
    ` : ''}
  `;
  
  // إعادة إرفاق مستمعي الأحداث للأزرار الجديدة
  if (order.status === 'pending') {
    const newApproveBtn = document.getElementById('approve-order-btn');
    const newRejectBtn = document.getElementById('reject-order-btn');
    const newChatWithBuyerBtn = document.getElementById('chat-with-buyer-btn');
    const newChatWithSellerBtn = document.getElementById('chat-with-seller-btn');
    
    newApproveBtn.addEventListener('click', () => {
      updateOrderStatus(order.id, 'approved');
    });
    
    newRejectBtn.addEventListener('click', () => {
      updateOrderStatus(order.id, 'rejected');
    });
    
    newChatWithBuyerBtn.addEventListener('click', () => {
      openChat({ id: order.buyerId, name: buyerData ? buyerData.name : 'المشتري' });
    });
    
    newChatWithSellerBtn.addEventListener('click', () => {
      openChat({ id: order.sellerId, name: sellerData ? sellerData.name : 'البائع' });
    });
  }
  
  showPage(orderDetailPage);
}

// قبول الطلب
approveOrderBtn.addEventListener('click', async () => {
  if (!currentOrder) return;
  
  try {
    await updateOrderStatus(currentOrder.id, 'approved');
    alert('تم قبول الطلب بنجاح');
    showPage(ordersPage);
  } catch (error) {
    console.error('Error approving order:', error);
    alert('حدث خطأ أثناء قبول الطلب');
  }
});

// رفض الطلب
rejectOrderBtn.addEventListener('click', async () => {
  if (!currentOrder) return;
  
  try {
    await updateOrderStatus(currentOrder.id, 'rejected');
    alert('تم رفض الطلب بنجاح');
    showPage(ordersPage);
  } catch (error) {
    console.error('Error rejecting order:', error);
    alert('حدث خطأ أثناء رفض الطلب');
  }
});

// التحدث مع المشتري
chatWithBuyerBtn.addEventListener('click', () => {
  if (!currentOrder) return;
  
  // هذه الوظيفة تحتاج إلى معلومات المشتري
  // سنفتح صفحة الرسائل مع التركيز على محادثة المشتري
  showPage(messagesPage);
  // سنحتاج إلى تحميل محادثة المشتري هنا
});

// التحدث مع البائع
chatWithSellerBtn.addEventListener('click', () => {
  if (!currentOrder) return;
  
  // هذه الوظيفة تحتاج إلى معلومات البائع
  // سنفتح صفحة الرسائل مع التركيز على محادثة البائع
  showPage(messagesPage);
  // سنحتاج إلى تحميل محادثة البائع هنا
});

// تحديث حالة الطلب
async function updateOrderStatus(orderId, status) {
  const orderRef = ref(database, 'orders/' + orderId);
  await update(orderRef, { status: status });
}

// فلاتر الطلبات
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadOrders(btn.dataset.filter);
  });
});

// فتح صفحة الطلبات (للإدارة فقط)
function openOrdersPage() {
  if (!currentUserData || !currentUserData.isAdmin) {
    alert('عفواً، هذه الصفحة للإدارة فقط');
    return;
  }
  
  loadOrders();
  showPage(ordersPage);
}

// إضافة أيقونة الإدارة إلى Footer
function addAdminIconToFooter() {
  const footerIcons = document.querySelector('.footer-icons');
  const adminIcon = document.getElementById('admin-icon');
  
  adminIcon.addEventListener('click', () => {
    openOrdersPage();
  });
}

// تحميل الرسائل والمستخدمين
function loadMessages() {
  const user = auth.currentUser;
  if (!user) return;
  
  if (currentUserData && currentUserData.isAdmin) {
    loadAllUsersForAdmin(user.uid);
  } else {
    loadAdminUsersForMessages(user.uid);
  }
}

// تحميل جميع المستخدمين الذين تواصلوا مع الإدارة (للمشرفين)
function loadAllUsersForAdmin(currentUserId) {
  const messagesRef = ref(database, 'messages');
  onValue(messagesRef, (snapshot) => {
    usersList.innerHTML = '';
    userMessages = {};
    userUnreadCounts = {};
    userLastMessageTime = {};
    
    if (!snapshot.exists()) {
      usersList.innerHTML = '<div class="no-users">لا توجد رسائل بعد</div>';
      return;
    }
    
    // تجميع المستخدمين الذين لديهم محادثات
    const usersWithMessages = new Set();
    
    snapshot.forEach((childSnapshot) => {
      const message = childSnapshot.val();
      
      // إضافة المرسل والمستقبل إلى مجموعة المستخدمين
      if (message.senderId !== currentUserId) {
        usersWithMessages.add(message.senderId);
      }
      if (message.receiverId !== currentUserId) {
        usersWithMessages.add(message.receiverId);
      }
      
      // تجميع الرسائل لكل مستخدم
      const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
      if (!userMessages[otherUserId]) {
        userMessages[otherUserId] = [];
      }
      userMessages[otherUserId].push(message);
      
      // حساب الرسائل غير المقروءة
      if (message.receiverId === currentUserId && !message.isRead) {
        userUnreadCounts[otherUserId] = (userUnreadCounts[otherUserId] || 0) + 1;
      }
      
      // تحديث وقت آخر رسالة
      if (!userLastMessageTime[otherUserId] || message.timestamp > userLastMessageTime[otherUserId]) {
        userLastMessageTime[otherUserId] = message.timestamp;
      }
    });
    
    // تحميل معلومات المستخدمين
    loadUsersInfo(Array.from(usersWithMessages), currentUserId);
  });
}

// تحميل معلومات المستخدمين للمشرف
function loadUsersInfo(usersArray, currentUserId) {
  const usersRef = ref(database, 'users');
  onValue(usersRef, (snapshot) => {
    if (snapshot.exists()) {
      const allUsers = snapshot.val();
      const usersToShow = [];
      
      // جمع بيانات المستخدمين
      for (const userId of usersArray) {
        if (allUsers[userId] && userId !== currentUserId) {
          usersToShow.push({
            id: userId,
            ...allUsers[userId]
          });
        }
      }
      
      // عرض قائمة المستخدمين
      displayUsersList(usersToShow, currentUserId);
    }
  });
}

// تحميل الإدارة فقط للمستخدم العادي
function loadAdminUsersForMessages(currentUserId) {
  usersList.innerHTML = '';
  
  if (adminUsers.length === 0) {
    usersList.innerHTML = '<div class="no-users">لا يوجد مشرفون متاحون</div>';
    return;
  }
  
  // تحميل رسائل المستخدمين
  loadUserMessages(adminUsers, currentUserId);
  
  // عرض قائمة المشرفين
  displayUsersList(adminUsers, currentUserId);
}

// تحميل رسائل المستخدمين
function loadUserMessages(users, currentUserId) {
  // إزالة المستمع السابق إذا كان موجوداً
  if (messagesListener) {
    messagesListener();
  }
  
  const messagesRef = ref(database, 'messages');
  messagesListener = onValue(messagesRef, (snapshot) => {
    userMessages = {};
    userUnreadCounts = {};
    userLastMessageTime = {};
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        
        // التحقق مما إذا كانت الرسالة مرتبطة بأي من المستخدمين المعروضين
        const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
        
        // إذا كان المستخدم الآخر في قائمة المستخدمين المعروضين
        if (users.some(user => user.id === otherUserId)) {
          if (!userMessages[otherUserId]) {
            userMessages[otherUserId] = [];
          }
          userMessages[otherUserId].push(message);
          
          // حساب الرسائل غير المقروءة
          if (message.receiverId === currentUserId && !message.isRead) {
            userUnreadCounts[otherUserId] = (userUnreadCounts[otherUserId] || 0) + 1;
          }
          
          // تحديث وقت آخر رسالة
          if (!userLastMessageTime[otherUserId] || message.timestamp > userLastMessageTime[otherUserId]) {
            userLastMessageTime[otherUserId] = message.timestamp;
          }
        }
      });
    }
    
    // تحديث قائمة المستخدمين لتعكس الرسائل الجديدة
    displayUsersList(users, currentUserId);
  });
}

// عرض قائمة المستخدمين
function displayUsersList(users, currentUserId) {
  usersList.innerHTML = '';
  
  if (users.length === 0) {
    usersList.innerHTML = '<div class="no-users">لا يوجد مستخدمون</div>';
    return;
  }
  
  users.forEach(user => {
    const userElement = document.createElement('div');
    userElement.className = 'user-item';
    userElement.dataset.userId = user.id;
    
    if (user.id === activeUserId) {
      userElement.classList.add('active');
    }
    
    const unreadCount = userUnreadCounts[user.id] || 0;
    const lastMessageTime = userLastMessageTime[user.id] ? formatDate(userLastMessageTime[user.id]) : 'لا توجد رسائل';
    
    userElement.innerHTML = `
      <div class="user-avatar">
        <i class="fas fa-user"></i>
      </div>
      <div class="user-info">
        <div class="user-name">${user.name || 'مستخدم'}</div>
        <div class="user-status">${lastMessageTime}</div>
      </div>
      ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
    `;
    
    userElement.addEventListener('click', () => {
      openChat(user);
    });
    
    usersList.appendChild(userElement);
  });
  
  // ترتيب القائمة حسب وقت آخر رسالة
  sortUsersList();
}

// فتح محادثة مع مستخدم
function openChat(userData) {
  activeUserId = userData.id;
  
  // تحديث الواجهة
  document.querySelectorAll('.user-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.userId === activeUserId) {
      item.classList.add('active');
    }
  });
  
  currentChatUser.textContent = userData.name || 'مستخدم';
  
  // عرض مؤشر إذا كان المستخدم مشرفاً
  displayAdminIndicator(userData.isAdmin);
  
  // عرض الرسائل
  displayMessages(userData.id);
  
  // وضع علامة على الرسائل كمقروءة
  markMessagesAsRead(userData.id);
}

// عرض الرسائل في المحادثة
function displayMessages(userId) {
  messagesContainer.innerHTML = '';
  
  if (!userMessages[userId] || userMessages[userId].length === 0) {
    messagesContainer.innerHTML = '<div class="no-messages">لا توجد رسائل بعد</div>';
    return;
  }
  
  // ترتيب الرسائل من الأقدم إلى الأحدث
  const sortedMessages = [...userMessages[userId]].sort((a, b) => {
    if (a.timestamp && b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    return 0;
  });
  
  // عرض الرسائل
  sortedMessages.forEach(message => {
    addMessageToChat(message, userId);
  });
  
  // التمرير إلى أحدث رسالة
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// إضافة رسالة إلى الدردشة
function addMessageToChat(message, userId) {
  const messageElement = document.createElement('div');
  const isSent = message.senderId === auth.currentUser.uid;
  
  messageElement.className = `message ${isSent ? 'sent' : 'received'}`;
  messageElement.innerHTML = `
    <div class="message-content">${message.content}</div>
    <div class="message-time">${formatDate(message.timestamp)}</div>
  `;
  
  messagesContainer.appendChild(messageElement);
}

// وضع علامة على الرسائل كمقروءة
function markMessagesAsRead(userId) {
  const user = auth.currentUser;
  if (!user) return;
  
  if (userMessages[userId]) {
    const updates = {};
    
    userMessages[userId].forEach(message => {
      if (message.receiverId === user.uid && !message.isRead) {
        updates[`messages/${message.id}/isRead`] = true;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      update(ref(database), updates);
    }
  }
}

// ترتيب قائمة المستخدمين
function sortUsersList() {
  const userItems = Array.from(usersList.querySelectorAll('.user-item'));
  
  userItems.sort((a, b) => {
    const aTime = userLastMessageTime[a.dataset.userId] || 0;
    const bTime = userLastMessageTime[b.dataset.userId] || 0;
    
    return bTime - aTime;
  });
  
  userItems.forEach(item => usersList.appendChild(item));
}

// عرض مؤشر الصلاحية في واجهة الرسائل
function displayAdminIndicator(isAdmin) {
  const chatHeader = document.getElementById('chat-header');
  
  if (isAdmin) {
    if (!chatHeader.querySelector('.admin-indicator')) {
      const indicator = document.createElement('span');
      indicator.className = 'admin-indicator';
      indicator.innerHTML = ' <i class="fas fa-shield-alt"></i> مشرف';
      chatHeader.appendChild(indicator);
    }
  } else {
    const indicator = chatHeader.querySelector('.admin-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}

// إرسال رسالة مع التحقق من الصلاحية
sendMessageBtn.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (!message || !activeUserId) return;
  
  const user = auth.currentUser;
  if (!user) return;
  
  sendMessageToUser(message, user, activeUserId);
  messageInput.value = '';
});

// دالة منفصلة لإرسال الرسالة
function sendMessageToUser(message, user, receiverId) {
  const newMessage = {
    senderId: user.uid,
    receiverId: receiverId,
    content: message,
    timestamp: serverTimestamp(),
    isRead: false
  };
  
  const messagesRef = ref(database, 'messages');
  const newMessageRef = push(messagesRef);
  newMessage.id = newMessageRef.key;
  
  set(newMessageRef, newMessage)
    .then(() => {
      // إضافة الرسالة إلى الدردشة فوراً
      addMessageToChat(newMessage, receiverId);
      
      // التمرير إلى الأسفل
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    })
    .catch(error => {
      console.error('Error sending message:', error);
      alert('حدث خطأ أثناء إرسال الرسالة');
    });
}

// وظائف مساعدة
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  page.classList.remove('hidden');
}

function showAuthMessage(message, type) {
  authMessage.textContent = message;
  authMessage.className = '';
  authMessage.classList.add(type + '-message');
}

function getAuthErrorMessage(code) {
  switch(code) {
    case 'auth/invalid-email': return 'البريد الإلكتروني غير صالح';
    case 'auth/user-disabled': return 'هذا الحساب معطل';
    case 'auth/user-not-found': return 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني';
    case 'auth/wrong-password': return 'كلمة المرور غير صحيحة';
    case 'auth/email-already-in-use': return 'هذا البريد الإلكتروني مستخدم بالفعل';
    case 'auth/weak-password': return 'كلمة المرور ضعيفة (يجب أن تحتوي على 6 أحرف على الأقل)';
    default: return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
  }
}

function formatDate(timestamp) {
  if (!timestamp) return 'غير معروف';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'اليوم ' + date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'أمس ' + date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('ar-EG') + ' ' + date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }
}

// إضافة مستمعي الأحداث للأزرار الجديدة
closeOrdersBtn.addEventListener('click', () => {
  showPage(homePage);
  if (ordersListener) {
    ordersListener();
    ordersListener = null;
  }
});

closeOrderDetailBtn.addEventListener('click', () => {
  showPage(ordersPage);
});

// تسجيل الدخول
loginBtn.addEventListener('click', e => {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showAuthMessage('يرجى ملء جميع الحقول', 'error');
    return;
  }
  
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      showAuthMessage('تم تسجيل الدخول بنجاح', 'success');
      setTimeout(() => {
        showPage(homePage);
        resetAuthForms();
      }, 1000);
    })
    .catch((error) => {
      showAuthMessage(getAuthErrorMessage(error.code), 'error');
    });
});

// إنشاء حساب
signupBtn.addEventListener('click', e => {
  e.preventDefault();
  
  const name = document.getElementById('signup-name').value;
  const phone = document.getElementById('signup-phone').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const address = document.getElementById('signup-address').value;
  
  if (!name || !email || !password) {
    showAuthMessage('يرجى ملء الحقول الإلزامية (الاسم، البريد، كلمة المرور)', 'error');
    return;
  }
  
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      
      // حفظ بيانات المستخدم الإضافية
      const userData = {
        name: name,
        phone: phone || '',
        email: email,
        address: address || '',
        isAdmin: false,
        createdAt: serverTimestamp()
      };
      
      set(ref(database, 'users/' + user.uid), userData)
        .then(() => {
          showAuthMessage('تم إنشاء الحساب بنجاح', 'success');
          setTimeout(() => {
            showPage(homePage);
            resetAuthForms();
          }, 1000);
        })
        .catch((error) => {
          showAuthMessage('حدث خطأ في حفظ البيانات الإضافية', 'error');
        });
    })
    .catch((error) => {
      showAuthMessage(getAuthErrorMessage(error.code), 'error');
    });
});

// تسجيل الخروج
logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    showPage(homePage);
    // إزالة مستمع الرسائل عند تسجيل الخروج
    if (messagesListener) {
      messagesListener();
      messagesListener = null;
    }
  });
});

// إضافة منشور جديد - تم نقله إلى صفحة منفصلة
addPostIcon.addEventListener('click', () => {
  const user = auth.currentUser;
  if (user) {
    // الانتقال إلى صفحة إضافة المنشور المنفصلة
    window.location.href = 'add-post.html';
  } else {
    showPage(authPage);
  }
});

// عرض معلومات المستخدم
profileIcon.addEventListener('click', () => {
  const user = auth.currentUser;
  if (!user) {
    showPage(authPage);
    return;
  }
  
  const userRef = ref(database, 'users/' + user.uid);
  onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.val();
      
      document.getElementById('profile-name').textContent = userData.name || 'غير معروف';
      document.getElementById('profile-email').textContent = userData.email || 'غير معروف';
      document.getElementById('profile-phone').textContent = userData.phone || 'غير معروف';
      document.getElementById('profile-address').textContent = userData.address || 'غير معروف';
      
      showPage(profilePage);
    }
  });
});

// فتح صفحة الرسائل
messagesIcon.addEventListener('click', () => {
  const user = auth.currentUser;
  if (!user) {
    showPage(authPage);
    return;
  }
  
  loadMessages();
  showPage(messagesPage);
});

// العودة للصفحة الرئيسية
homeIcon.addEventListener('click', () => {
  showPage(homePage);
});

// إغلاق صفحة التوثيق
closeAuthBtn.addEventListener('click', () => {
  showPage(homePage);
});

// إغلاق صفحة الملف الشخصي
closeProfileBtn.addEventListener('click', () => {
  showPage(homePage);
});

// إغلاق صفحة الرسائل
closeMessagesBtn.addEventListener('click', () => {
  showPage(homePage);
  // إزالة مستمع الرسائل عند إغلاق الصفحة
  if (messagesListener) {
    messagesListener();
    messagesListener = null;
  }
});

// إغلاق صفحة تفاصيل المنشور
closePostDetailBtn.addEventListener('click', () => {
  showPage(homePage);
});

// تغيير علامات التوثيق
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if (btn.id === 'login-tab') {
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    } else {
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    }
  });
});

// إعادة تعيين نماذج التوثيق
function resetAuthForms() {
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('signup-name').value = '';
  document.getElementById('signup-phone').value = '';
  document.getElementById('signup-email').value = '';
  document.getElementById('signup-password').value = '';
  document.getElementById('signup-address').value = '';
  authMessage.textContent = '';
  authMessage.className = '';
    }
