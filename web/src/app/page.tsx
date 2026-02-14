export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-b from-white to-gray-50 p-8 text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
                Relive the Moment.
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mb-10">
                Securely share photos from your events. Our AI automatically finds photos of you, so you don't have to scroll through thousands of images.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <a
                    href="/upload"
                    className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition shadow-lg"
                >
                    Upload Photos
                </a>
                <a
                    href="/enroll"
                    className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-semibold hover:bg-gray-50 transition shadow-sm"
                >
                    Setup FaceID
                </a>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl w-full">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4 text-blue-600">📸</div>
                    <h3 className="font-bold text-lg mb-2">Upload Instantly</h3>
                    <p className="text-gray-500 text-sm">Drag and drop thousands of photos. We handle the storage and processing securely.</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4 text-purple-600">🤖</div>
                    <h3 className="font-bold text-lg mb-2">AI Face Matching</h3>
                    <p className="text-gray-500 text-sm">Enroll with a selfie and let our AI find every photo you are in across all events.</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="bg-green-100 p-3 rounded-lg w-fit mb-4 text-green-600">🔒</div>
                    <h3 className="font-bold text-lg mb-2">Private & Secure</h3>
                    <p className="text-gray-500 text-sm">Your photos are private. Only you and people in the photo can see them.</p>
                </div>
            </div>
        </div>
    );
}
