const API_URL = import.meta.env.VITE_AUTH_API_URL;

export const authService = {
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                let data = await response.json();
                throw new Error(data.msg ? data.msg : "Invalid credentials");
            }

            return response.json();
        } catch (error) {
            throw new Error(error);
        }
    },

    register: async (name, email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password })
            });

            if (!response.ok) {
                throw new Error("Registration failed");
            }

            return response.json();
        } catch (error) {
            throw new Error(error);
        }
    }
};
