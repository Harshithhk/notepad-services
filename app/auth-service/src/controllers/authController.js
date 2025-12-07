import User from "../models/user.js";

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ msg: "User already exists" });

        const user = await User.create({ name, email, password });

        res.json({ msg: "User created", userId: user._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


const login = async (req, res) => {

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ msg: "User not found" });

        if (password !== user.password)
            return res.status(400).json({ msg: "Incorrect password" });

        const userTemp = user.toObject();

        delete userTemp.password;

        res.json(userTemp);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


export { register, login }