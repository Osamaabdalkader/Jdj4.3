import { 
    auth, database, storage, 
    onAuthStateChanged, ref, push, serverTimestamp, set,
    storageRef, uploadBytesResumable, getDownloadURL,
    onValue
} from './firebase-init.js';

// عناصر DOM
const loadingOverlay = document.getElementById('loading-overlay');
const uploadProgress = document.getElementById('upload-progress');
const publishBtn = document.getElementById('publish-btn');
const postImageInput = document.getElementById('post-image');
const chooseImageBtn = document.getElementById('choose-image-btn');
const cameraBtn = document.getElementById('camera-btn');
const imageName = document.getElementById('image-name');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const removeImageBtn = document.getElementById('remove-image-btn');
const homeIcon = document.getElementById('home-icon');
const userInfo = document.getElementById('user-info');

// متغيرات النظام
let currentUserData = null;
let selectedImageFile = null;

// تحقق من حالة المستخدم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
});

// التحقق من حالة المصادقة
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // المستخدم مسجل الدخول
            const userRef = ref(database, 'users/' + user.uid);
            
            onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    currentUserData = snapshot.val();
                    currentUserData.uid = user.uid;
                    updateUserInfo();
                } else {
                    // إذا لم يكن لدى المستخدم بيانات، توجيهه للصفحة الرئيسية
                    window.location.href = 'index.html';
                }
            });
        } else {
            // إذا لم يكن المستخدم مسجلاً، إعادة توجيهه للصفحة الرئيسية
            window.location.href = 'index.html';
        }
    });
}

// تحديث معلومات المستخدم في الواجهة
function updateUserInfo() {
    if (currentUserData) {
        userInfo.innerHTML = `
            <div class="user-detail">
                <i class="fas fa-user"></i>
                <span>${currentUserData.name || 'مستخدم'}</span>
            </div>
        `;
    }
}

// نشر منشور جديد
publishBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('post-title').value.trim();
    const description = document.getElementById('post-description').value.trim();
    const price = document.getElementById('post-price').value.trim();
    const location = document.getElementById('post-location').value.trim();
    const phone = document.getElementById('post-phone').value.trim();
    
    // التحقق من صحة البيانات
    if (!title) {
        alert('يرجى إدخال عنوان للمنشور');
        return;
    }
    
    if (!description) {
        alert('يرجى إدخال وصف للمنشور');
        return;
    }
    
    if (!selectedImageFile) {
        alert('يرجى إضافة صورة للمنشور');
        return;
    }
    
    // عرض شاشة التحميل
    loadingOverlay.classList.remove('hidden');
    
    try {
        let imageUrl = '';
        
        // إذا تم اختيار صورة، رفعها إلى التخزين
        if (selectedImageFile) {
            imageUrl = await uploadImage(selectedImageFile);
        }
        
        // إنشاء المنشور في قاعدة البيانات
        await createPost(title, description, price, location, phone, imageUrl);
        
        // إخفاء شاشة التحميل
        loadingOverlay.classList.add('hidden');
        
        // عرض رسالة نجاح
        alert('تم نشر المنشور بنجاح!');
        
        // إعادة تعيين النموذج
        resetAddPostForm();
        
        // العودة إلى الصفحة الرئيسية
        window.location.href = 'index.html';
        
    } catch (error) {
        // إخفاء شاشة التحميل
        loadingOverlay.classList.add('hidden');
        
        // عرض رسالة الخطأ
        alert('حدث خطأ أثناء نشر المنشور: ' + error.message);
        console.error('Error publishing post:', error);
    }
});

// رفع الصورة إلى التخزين
async function uploadImage(file) {
    return new Promise((resolve, reject) => {
        const storageReference = storageRef(storage, 'posts/' + Date.now() + '_' + file.name);
        const uploadTask = uploadBytesResumable(storageReference, file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // تحديث شريط التقدم
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                uploadProgress.style.width = progress + '%';
            },
            (error) => {
                reject(error);
            },
            async () => {
                // اكتمال الرفع، الحصول على رابط التحميل
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

// إنشاء منشور في قاعدة البيانات
async function createPost(title, description, price, location, phone, imageUrl) {
    const postsRef = ref(database, 'posts');
    const newPostRef = push(postsRef);
    
    const postData = {
        id: newPostRef.key,
        title: title,
        description: description,
        price: price || 'غير محدد',
        location: location || 'غير محدد',
        phone: phone || 'غير محدد',
        imageUrl: imageUrl || '',
        authorId: currentUserData.uid,
        authorName: currentUserData.name || 'مستخدم',
        createdAt: serverTimestamp()
    };
    
    await set(newPostRef, postData);
}

// إعادة تعيين نموذج إضافة المنشور
function resetAddPostForm() {
    document.getElementById('post-title').value = '';
    document.getElementById('post-description').value = '';
    document.getElementById('post-price').value = '';
    document.getElementById('post-location').value = '';
    document.getElementById('post-phone').value = '';
    postImageInput.value = '';
    imageName.textContent = 'لم يتم اختيار صورة';
    imagePreview.classList.add('hidden');
    selectedImageFile = null;
}

// اختيار صورة من المعرض
chooseImageBtn.addEventListener('click', () => {
    postImageInput.click();
});

// فتح الكاميرا (إذا كان الجهاز يدعمها)
cameraBtn.addEventListener('click', () => {
    postImageInput.setAttribute('capture', 'environment');
    postImageInput.click();
});

// عرض معاينة الصورة
postImageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        selectedImageFile = file;
        imageName.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// إزالة الصورة المختارة
removeImageBtn.addEventListener('click', () => {
    postImageInput.value = '';
    imageName.textContent = 'لم يتم اختيار صورة';
    imagePreview.classList.add('hidden');
    selectedImageFile = null;
});

// العودة للصفحة الرئيسية
homeIcon.addEventListener('click', () => {
    window.location.href = 'index.html';
});