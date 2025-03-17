import { ScrollView, View } from 'react-native';
import { Text } from '@/components/nativewindui/Text';

export default function EulaScreen() {
    return (
        <ScrollView style={{ flex: 1 }}>
            <View style={{ padding: 20 }}>
                <Text variant="title1">End User License Agreement (EULA) for Olas</Text>

                <Text variant="caption1" className="text-muted-foreground">
                    Last Updated: March 19, 2024
                </Text>

                <Text variant="body" className="mt-4">
                    This End User License Agreement ("EULA") is a legal agreement between you ("User" or "You") and Sanity Island Inc.
                    ("Company," "We," "Us," or "Our") for the use of the Olas application ("App"), an Instagram-like application built on
                    Nostr. By downloading, installing, or using the App, you agree to be bound by the terms of this Agreement.
                </Text>

                <Text variant="title2" className="mt-6">
                    Prohibited Content and Conduct
                </Text>
                <Text variant="body" className="mt-2">
                    You agree not to use our application to create, upload, post, send, or store any content that:
                </Text>
                <Text variant="body" className="ml-4 mt-2">
                    • Is illegal, infringing, or fraudulent{'\n'}• Is defamatory, libelous, or threatening{'\n'}• Is pornographic, obscene,
                    or offensive{'\n'}• Is discriminatory or promotes hate speech{'\n'}• Is harmful to minors{'\n'}• Is intended to harass
                    or bully others{'\n'}• Is intended to impersonate others
                </Text>

                <Text variant="body" className="mt-4">
                    You also agree not to engage in any conduct that:
                </Text>
                <Text variant="body" className="ml-4 mt-2">
                    • Harasses or bullies others{'\n'}• Impersonates others{'\n'}• Is intended to intimidate or threaten others{'\n'}• Is
                    intended to promote or incite violence
                </Text>

                <Text variant="title2" className="mt-6">
                    Consequences of Violation
                </Text>
                <Text variant="body" className="mt-2">
                    Any violation of this EULA, including the prohibited content and conduct outlined above, may result in the termination
                    of your access to our application.
                </Text>

                <Text variant="title2" className="mt-6">
                    Disclaimer of Warranties and Limitation of Liability
                </Text>
                <Text variant="body" className="mt-2">
                    The App is provided "as is" and "as available" without warranties of any kind, whether express or implied. The Company
                    does not warrant that the App will be error-free or uninterrupted. In no event shall Sanity Island Inc. be liable for
                    any damages whatsoever, including but not limited to direct, indirect, special, incidental, or consequential damages,
                    arising out of or in connection with the use or inability to use our application.
                </Text>

                <Text variant="title2" className="mt-6">
                    Changes to EULA
                </Text>
                <Text variant="body" className="mt-2">
                    We reserve the right to update or modify this EULA at any time and without prior notice. Your continued use of our
                    application following any changes to this EULA will be deemed to be your acceptance of such changes.
                </Text>

                <Text variant="title2" className="mt-6">
                    Contact Information
                </Text>
                <Text variant="body" className="mt-2">
                    If you have any questions about this EULA, please contact us at support@olas.app
                </Text>

                <Text variant="title2" className="mt-6">
                    Acceptance of Terms
                </Text>
                <Text variant="body" className="mb-8 mt-2">
                    By using the Olas app, you signify your acceptance of this EULA. If you do not agree to this EULA, you may not use our
                    Application.
                </Text>
            </View>
        </ScrollView>
    );
}
