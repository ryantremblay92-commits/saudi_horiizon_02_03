import mongoose, { Document, Schema } from 'mongoose';

export interface IQuoteRequest extends Document {
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    projectType?: string;
    items: string;
    quantities?: string;
    timeline?: string;
    notes?: string;
    status: 'pending' | 'reviewed' | 'responded' | 'cancelled';
    createdAt: Date;
    updatedAt: Date;
}

const quoteRequestSchema = new Schema<IQuoteRequest>({
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    projectType: { type: String },
    items: { type: String, required: true },
    quantities: { type: String },
    timeline: { type: String },
    notes: { type: String },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'responded', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const QuoteRequest = mongoose.models.QuoteRequest || mongoose.model<IQuoteRequest>('QuoteRequest', quoteRequestSchema);

export default QuoteRequest;
