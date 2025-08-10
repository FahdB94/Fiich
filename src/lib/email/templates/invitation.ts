export function buildInvitationEmailHtml(companyName: string, inviteLink: string, message?: string) {
  return `
  <div style="font-family: Inter, Arial, sans-serif; max-width: 640px; margin: 0 auto;">
    <div style="padding: 24px; border-radius: 16px; background: linear-gradient(135deg,#f8fafc,#eef2ff);">
      <h2 style="margin:0 0 12px; color:#0f172a;">Invitation à consulter ${companyName}</h2>
      <p style="margin:0 0 16px; color:#334155;">Vous avez été invité(e) à consulter la fiche et les documents de ${companyName}.</p>
      ${message ? `<div style="margin:16px 0; padding:12px; border-radius:12px; background:#fff; color:#334155;"><strong>Message :</strong><br/>${message}</div>` : ''}
      <div style="text-align:center; margin: 24px 0;">
        <a href="${inviteLink}" style="display:inline-block; padding:12px 20px; background:#4f46e5; color:#fff; text-decoration:none; border-radius:10px;">Accepter l'invitation</a>
      </div>
      <p style="font-size:12px; color:#64748b;">Si le bouton ne fonctionne pas, copiez/collez ce lien dans votre navigateur :</p>
      <p style="font-size:12px; color:#64748b; word-break:break-all;">${inviteLink}</p>
    </div>
    <p style="font-size:12px; color:#94a3b8; text-align:center; margin-top:12px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>`
}

export function buildInvitationEmailText(companyName: string, inviteLink: string, message?: string) {
  return `Invitation à consulter ${companyName}\n\n${message ? `Message:\n${message}\n\n` : ''}Acceptez l'invitation: ${inviteLink}`
}



