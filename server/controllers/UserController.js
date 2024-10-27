import { Webhook } from 'svix';
import userModel from '../model/userModel.js';

const clerkWebhooks = async (req, res) => {
    try {
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        // Verify the webhook
        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        });

        const { data, type } = req.body;

        console.log("Webhook payload:", req.body); // Log the entire payload

        switch (type) {
            case "user.created": {
                console.log("Data received on user.created:", data);

                const userData = {
                    clerkId: data.id,
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url
                };

                await userModel.create(userData)
                res.json({})
                break;
            }

            case "user.updated": {
                console.log("Data received on user.updated:", data);

                const userData = {
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url
                };

                await userModel.findOneAndUpdate({ clerkId: data.id }, userData);
                res.json({ success: true, message: "User updated successfully" });

                break;
            }

            case "user.deleted": {
                await userModel.findOneAndDelete({ clerkId: data.id });
                res.json({ success: true, message: "User deleted successfully" });
                break;
            }

            default:
                res.json({ success: false, message: "Unknown event type" });
                break;
        }

    } catch (error) {
        console.log("Error in webhook handling:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { clerkWebhooks };
