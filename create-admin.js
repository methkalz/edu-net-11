// إنشاء حساب آدمن مؤقت
async function createAdmin() {
  const response = await fetch('/functions/v1/create-demo-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  console.log('Admin creation result:', result);
}

// تشغيل الوظيفة
createAdmin();