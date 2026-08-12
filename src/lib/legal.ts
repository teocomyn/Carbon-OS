import "server-only";

function publicValue(value: string | undefined) {
  return value?.trim() || null;
}

export const legalIdentity = {
  name: publicValue(process.env.LEGAL_PUBLISHER_NAME),
  status: publicValue(process.env.LEGAL_PUBLISHER_STATUS),
  address: publicValue(process.env.LEGAL_PUBLISHER_ADDRESS),
  registration: publicValue(process.env.LEGAL_PUBLISHER_REGISTRATION),
  email: publicValue(process.env.LEGAL_CONTACT_EMAIL),
};

export const isLegalIdentityComplete = Boolean(
  legalIdentity.name &&
    legalIdentity.status &&
    legalIdentity.address &&
    legalIdentity.email,
);
