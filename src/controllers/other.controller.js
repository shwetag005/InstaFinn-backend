import {
    getLoanApplicationStatus as getLoanApplicationStatusService
} from '../services/other.service.js';


export const getLoanApplicationStatus = async (req, res) => {
    try {
        const other = await getLoanApplicationStatusService(req.user.id, req.user.role);
        //res.status(200).json({message: 'Loan application status retrieved successfully', data: other});
        res.status(200).json({message: 'Data Fetched Successfully', data: other});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOtherByIdService = async (req, res) => {
    try {
        const { id } = req.params;
        const other = await OtherService.findById(id).populate('createdBy', 'name');
        if (!other) return res.status(404).json({ message: 'Other not found' });
        res.status(200).json(other);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createOtherService = async (req, res) => {
    try {
        const other = await OtherService.create({ ...req.body, createdBy: req.user.id });
        res.status(201).json(other);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateOtherService = async (req, res) => {
    try {
        const { id } = req.params;
        const other = await OtherService.findByIdAndUpdate(id, req.body, { new: true });
        if (!other) return res.status(404).json({ message: 'Other not found' });
        res.status(200).json(other);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteOtherService = async (req, res) => {
    try {
        const { id } = req.params;
        const other = await OtherService.findByIdAndRemove(id);
        if (!other) return res.status(404).json({ message: 'Other not found' });
        res.status(200).json({ message: 'Other deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



