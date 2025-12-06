export const authService = {
    login: async (email, password) => {
        if (email === "test@gmail.com" && password === "123456") {
            return { email };
        }
        throw new Error("Invalid credentials");
    },

    register: async (email, password) => {
        return { success: true };
    }
};
