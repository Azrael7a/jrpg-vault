type AuthErrorLike = {
  code?: string;
  message?: string;
};

export function getAuthErrorMessage(
  error: unknown,
  fallback = "Une erreur est survenue. Réessaie dans quelques instants.",
) {
  const authError = error as AuthErrorLike | null;
  const code = authError?.code?.toLowerCase() ?? "";
  const message = authError?.message?.toLowerCase() ?? "";

  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("user already exists")
  ) {
    return "Un compte existe déjà avec cette adresse email.";
  }

  if (
    code === "weak_password" ||
    message.includes("password should be") ||
    message.includes("weak password")
  ) {
    return "Le mot de passe est trop faible. Utilise au moins 8 caractères.";
  }

  if (
    code === "email_address_invalid" ||
    message.includes("invalid email")
  ) {
    return "Cette adresse email n’est pas valide.";
  }

  if (
    code === "over_email_send_rate_limit" ||
    message.includes("email rate limit") ||
    message.includes("rate limit")
  ) {
    return "Trop de demandes ont été envoyées. Attends quelques minutes avant de réessayer.";
  }

  if (code === "signup_disabled" || message.includes("signups not allowed")) {
    return "La création de comptes est momentanément indisponible.";
  }

  if (
    code === "same_password" ||
    message.includes("new password should be different")
  ) {
    return "Le nouveau mot de passe doit être différent de l’ancien.";
  }

  if (
    code === "session_not_found" ||
    code === "otp_expired" ||
    code === "flow_state_not_found" ||
    message.includes("expired") ||
    message.includes("invalid token")
  ) {
    return "Ce lien n’est plus valide. Demande un nouveau lien et réessaie.";
  }

  return fallback;
}
