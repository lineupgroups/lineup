import DonationsTab from '../creator/DonationsTab';

export default function CreatorDonationsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Donations Overview</h1>
                    <p className="text-gray-600">
                        Track and analyze all incoming donations across your projects
                    </p>
                </div>
                <DonationsTab />
            </div>
        </div>
    );
}
