const userPhoneNumbers = new Map();

export const getUserPhoneNumber = (chatId) => userPhoneNumbers.get(chatId);

export const saveUserPhoneNumber = (chatId, phoneNumber) => {
    userPhoneNumbers.set(chatId, phoneNumber);
};