
import TrackingData from '../models/TrackingData.js';



let dashboardController = {
    getDashboard: async (req, res) => {
        try {

            const response = await TrackingData.find({})
            // const data = await response.json();
            const urls = response.map(item => item.websiteUrl);
            
            const cleanUrls = urls.filter(item => {if(item!==null){

                return item;
            }
            })

            const uniqueUrls = [...new Set(cleanUrls)];


            res.status(200).json({ data: uniqueUrls })
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

export default dashboardController;
