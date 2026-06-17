import { ObjectId } from "mongodb";
import { connection } from "../config/dbconfig.js";

export const CreateInterview = async (req, res) => {
  try {
    console.log("REQ USER:", req.user);
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const db = await connection();

    const collection = db.collection("interviews");

    const interview = {
      userId: req.user._id,
      role,
      messages: [],
      status: "active",
      summary: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(interview);

    return res.status(201).json({
      success: true,
      message: "Interview created successfully",
      interviewId: result.insertedId,
    });
  } catch (error) {
    console.error("Create Interview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getInterview = async (req, res) => {
    try{
        const { id } = req.params;

        const db = await connection();
        const collection = db.collection("interviews");
        const interview = await collection.findOne({
            _id: new ObjectId(id)
        })

        if(!interview){
            return res.status(404).json({
                success: false,
                message: "No interview found"
            })
        }

        return res.status(200).json({
            success: true,
            interview
        })
    }
    catch(error){
        console.error("Error fetching interview: ",error)
        res.status(500).json({
            message: error.message
        })
    }
}