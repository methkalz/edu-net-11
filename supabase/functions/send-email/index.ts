// Send email function - Force deployment v2.0
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("🚀 Send Email Edge Function is starting up...");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { studentEmail, studentName, schoolName, username, password, userType = 'student' } = await req.json();
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Function to get user type in Arabic
    const getUserTypeArabic = (type: string) => {
      const types = {
        'student': 'الطالب',
        'teacher': 'المعلم', 
        'school_admin': 'مدير المدرسة',
        'parent': 'الوالد'
      };
      return types[type as keyof typeof types] || 'الطالب';
    };

    // Send email using direct fetch to Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `التقنية ببساطة <onboarding@resend.dev>`,
        to: [studentEmail],
        subject: `أهلاً وسهلاً - مرحباً بك في التقنية ببساطة`,
        html: `
          <!DOCTYPE html>
          <html lang="ar" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap" rel="stylesheet">
            <style>
              * {
                font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
              }
              .login-button {
                display: inline-block;
                padding: 15px 30px;
                background: linear-gradient(135deg, #0B5394 0%, #1E88E5 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
                text-align: center;
                transition: all 0.3s ease;
              }
              .login-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(11, 83, 148, 0.3);
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; padding: 20px; max-width: 600px; margin: 0 auto;">
              
              <!-- Logo Section -->
              <div style="text-align: center; margin-bottom: 20px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <img src="https://edu-net.me/logo-mail.png" alt="شعار التقنية ببساطة" style="max-width: 200px; height: auto;" />
              </div>

              <!-- Header Section -->
              <div style="background: linear-gradient(135deg, #0B5394 0%, #1E88E5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 700; font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;">أهلاً وسهلاً</h1>
              </div>
              
              <!-- Content Section -->
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <h2 style="color: #333; margin-bottom: 20px; font-size: 24px; font-weight: 600; font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;">
                  عزيز${userType === 'student' ? 'ي' : userType === 'teacher' ? 'ي' : 'تي'} ${getUserTypeArabic(userType)} ${studentName}،
                </h2>
                
                <p style="color: #555; line-height: 1.8; margin-bottom: 20px; font-size: 16px; font-weight: 400; font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;">
                  مرحباً بك في <strong style="font-weight: 700; color: #0B5394;">التقنية ببساطة</strong>
                </p>
                
                ${username && password ? `
                <div style="background-color: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; border-right: 4px solid #0B5394;">
                  <h3 style="color: #333; margin-top: 0; margin-bottom: 18px; font-size: 20px; font-weight: 600; font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;">بيانات تسجيل الدخول:</h3>
                  <p style="margin: 8px 0; color: #555; font-size: 16px; font-weight: 400; font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;"><strong style="font-weight: 600;">البريد الإلكتروني:</strong> ${username}</p>
                  <p style="margin: 8px 0; color: #555; font-size: 16px; font-weight: 400; font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;"><strong style="font-weight: 600;">كلمة المرور:</strong> ${password}</p>
                </div>
                
                <!-- Login Button -->
                <div style="text-align: center; margin: 25px 0;">
                  <a href="http://www.edu-net.me" class="login-button" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #0B5394 0%, #1E88E5 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
                    تسجيل الدخول للموقع
                  </a>
                </div>
                ` : ''}
                
                <p style="color: #555; line-height: 1.8; margin-top: 25px; font-size: 16px; font-weight: 400; font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;">
                  نتمنى لك تجربة تعليمية ممتعة ومثمرة
                </p>
                
                <div style="text-align: center; margin-top: 35px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #666; font-size: 15px; font-weight: 400; font-family: 'Tajawal', 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0;">
                    مع أطيب التحيات،<br>
                    <strong style="font-weight: 700; color: #0B5394;">التقنية ببساطة</strong>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      
      // Handle specific Resend API errors
      if (emailResponse.status === 403 && errorText.includes('You can only send testing emails')) {
        throw new Error(`قيود البيئة التجريبية: يمكن إرسال الإيميلات فقط إلى البريد المسجل في Resend. لإرسال إيميلات لعناوين أخرى، يجب تفعيل نطاق مخصص في resend.com/domains`);
      }
      
      throw new Error(`Resend API error: ${emailResponse.status} - ${errorText}`);
    }

    const result = await emailResponse.json();

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: result.id,
      message: 'تم إرسال الرسالة الترحيبية بنجاح' 
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Send Email Function Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'فشل في إرسال الرسالة الترحيبية',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

// Edge Function deployed manually - v3.0