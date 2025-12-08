import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Refund Policy</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Refund Policy</h2>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h3>
              <p className="text-gray-700 leading-relaxed">
                At Xanting, we want you to be completely satisfied with your purchase. This Refund Policy explains our policy regarding refunds for premium subscriptions and in-app purchases.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Premium Subscriptions</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Premium subscriptions are billed on a recurring basis (monthly or annually). You may cancel your subscription at any time through your account settings.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Refunds for unused portions of your subscription period are available within 14 days of purchase</li>
                <li>To request a refund, please contact our support team at support@xanting.com</li>
                <li>Refunds will be processed to the original payment method within 5-10 business days</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">In-App Purchases</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Virtual items, coins, and other in-app purchases are generally non-refundable. However, we may consider refunds in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Unauthorized purchases made from your account</li>
                <li>Technical issues preventing you from using purchased items</li>
                <li>Duplicate charges due to system errors</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To request a refund, please contact us with the following information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Your account email address</li>
                <li>Order number or transaction ID</li>
                <li>Reason for refund request</li>
                <li>Date of purchase</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Email: <a href="mailto:support@xanting.com" className="text-velora-primary hover:underline">support@xanting.com</a>
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Processing Time</h3>
              <p className="text-gray-700 leading-relaxed">
                Refund requests are typically processed within 5-10 business days. Once approved, refunds will be credited to your original payment method. The time it takes for the refund to appear in your account depends on your payment provider.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Questions?</h3>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Refund Policy, please contact us at{' '}
                <a href="mailto:support@xanting.com" className="text-velora-primary hover:underline">
                  support@xanting.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}




export default function RefundPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Refund Policy</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Refund Policy</h2>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h3>
              <p className="text-gray-700 leading-relaxed">
                At Xanting, we want you to be completely satisfied with your purchase. This Refund Policy explains our policy regarding refunds for premium subscriptions and in-app purchases.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Premium Subscriptions</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Premium subscriptions are billed on a recurring basis (monthly or annually). You may cancel your subscription at any time through your account settings.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Refunds for unused portions of your subscription period are available within 14 days of purchase</li>
                <li>To request a refund, please contact our support team at support@xanting.com</li>
                <li>Refunds will be processed to the original payment method within 5-10 business days</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">In-App Purchases</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Virtual items, coins, and other in-app purchases are generally non-refundable. However, we may consider refunds in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Unauthorized purchases made from your account</li>
                <li>Technical issues preventing you from using purchased items</li>
                <li>Duplicate charges due to system errors</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To request a refund, please contact us with the following information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Your account email address</li>
                <li>Order number or transaction ID</li>
                <li>Reason for refund request</li>
                <li>Date of purchase</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Email: <a href="mailto:support@xanting.com" className="text-velora-primary hover:underline">support@xanting.com</a>
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Processing Time</h3>
              <p className="text-gray-700 leading-relaxed">
                Refund requests are typically processed within 5-10 business days. Once approved, refunds will be credited to your original payment method. The time it takes for the refund to appear in your account depends on your payment provider.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Questions?</h3>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Refund Policy, please contact us at{' '}
                <a href="mailto:support@xanting.com" className="text-velora-primary hover:underline">
                  support@xanting.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
