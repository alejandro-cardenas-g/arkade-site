import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

interface ContactResponse {
  success: boolean;
  message: string;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ContactResponse>> {
  try {
    const body: ContactRequest = await request.json();
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Hubo un problema al enviar tu mensaje" },
        { status: 400 },
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Hubo un problema al enviar tu mensaje" },
        { status: 400 },
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, message: "Hubo un problema al enviar tu mensaje" },
        { status: 400 },
      );
    }

    // Validate email format
    if (!validateEmail(email.trim())) {
      return NextResponse.json(
        { success: false, message: "Hubo un problema al enviar tu mensaje" },
        { status: 400 },
      );
    }

    // Get API key and destination email from environment
    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_EMAIL_TO;

    if (!apiKey) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { success: false, message: "Hubo un problema al enviar tu mensaje" },
        { status: 500 },
      );
    }

    if (!toEmail) {
      console.error("CONTACT_EMAIL_TO not configured");
      return NextResponse.json(
        { success: false, message: "Hubo un problema al enviar tu mensaje" },
        { status: 500 },
      );
    }

    // Send email via Resend
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "Arcade Vault <onboarding@resend.dev>",
      to: toEmail,
      subject: `Nuevo mensaje de contacto de ${name.trim()}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(name.trim())}</p>
        <p><strong>Email:</strong> ${escapeHtml(email.trim())}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(message.trim()).replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json(
      { success: true, message: "Email enviado correctamente" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { success: false, message: "Hubo un problema al enviar tu mensaje" },
      { status: 500 },
    );
  }
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
