const CheckLoadingAndError = ({ loading, error, requests }) => {

    if (loading) {
        return (
            <tr>
                <td colSpan={12} className="text-center py-12">
                    <div className="flex justify-center">
                        <div className="w-7 h-7 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                </td>
            </tr>

        )
    }

    if (error) {
        return (
            <tr>
                <td colSpan={12} className="text-center py-12">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4 text-red-600 text-sm">
                        {error}
                    </div>
                </td>
            </tr>
        )

    }

    if (requests.length === 0) {
        return (
            <tr>
                <td colSpan={12} className="text-center py-12 text-gray-400">
                    No requests found. Click New Request to place one.
                </td>
            </tr>
        )

    }

    return null

}

export default CheckLoadingAndError