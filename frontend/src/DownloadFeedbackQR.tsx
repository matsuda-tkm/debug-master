import React, { useEffect } from 'react';
import { Challenge } from './challengesData';
import { QRCodeSVG } from 'qrcode.react';
import { Octokit } from 'octokit';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'

interface DownloadFeedbackQRProps {
    challenge: Challenge;
    userAnswer: string;
};

const GITHUB_REPO_OWNER = 'matsuda-tkm';
const GITHUB_REPO_NAME = 'DebugMaster';
const FEEDBACK_DIR = 'feedbacks';


export const DownloadFeedbackQR: React.FC<DownloadFeedbackQRProps> = (props) => {
    const { challenge, userAnswer } = props;
    const octokit = new Octokit({
        auth: import.meta.env.VITE_GITHUB_ACCESS_TOKEN
    });
    const [feedbackFileURL, setFeedbackFileURL] = React.useState<string | null>(null);
    const [isError, setIsError] = React.useState<boolean>(false);

    const generateFeedbackContent = (challenge: Challenge, userAnswer: string) => {
        const mdContent = `# Debug Master Certification\n![DebugMater Logo](https://github-production-user-asset-6210df.s3.amazonaws.com/101240248/423011600-a72362aa-1892-4c1c-9822-8988580f80ca.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAVCODYLSA53PQK4ZA%2F20250315%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250315T025149Z&X-Amz-Expires=300&X-Amz-Signature=a92e83cad5bcac874339e209ca52b754833b4410b3e713f241e5a5bc23dc6d1b&X-Amz-SignedHeaders=host)\n## ${challenge.title}\n### 問題\n${challenge.description}\n### あなたの回答\n\`\`\`python\n${userAnswer}\n\`\`\``;
        return mdContent;
    };

    const encode = (str: string) => {
        const charCodes = new TextEncoder().encode(str);
        return btoa(String.fromCharCode(...charCodes));
    };

    const saveFeedbackContentToGithub = async (feedbackContent: string): Promise<string> => {
        const fileName = `${Date.now()}.md`;
        try {
            const response = await octokit.request(`PUT /repos/{owner}/{repo}/contents/{path}`, {
                owner: GITHUB_REPO_OWNER,
                repo: GITHUB_REPO_NAME,
                path: `${FEEDBACK_DIR}/${fileName}`,
                branch: 'test/exhibition',
                message: `Add user feedback for ${challenge.title}. timestamp: ${Date.now()}`,
                content: encode(feedbackContent),
            });

            return response.data.content.html_url;

        } catch (error) {
            console.error(error);
            setIsError(true);
            return '';
        }
    };

    useEffect(() => {
        (async () => {
            const feedbackContent = generateFeedbackContent(challenge, userAnswer);
            const feedbackDownloadURL = await saveFeedbackContentToGithub(feedbackContent);
            setFeedbackFileURL(feedbackDownloadURL);
        })();
    }, [challenge, userAnswer]);

    return (
        <div>
            {
                feedbackFileURL ?
                (
                    <>
                      <QRCodeSVG value={feedbackFileURL} />
                    </>
                )
                :
                (
                    <div>
                        <Skeleton width={128} height={128} />
                    </div>
                )
            }
        </div>
    )
};