import React, { useEffect } from 'react';
import { Challenge } from './challengesData';
import { QRCodeSVG } from 'qrcode.react';
import { Octokit } from 'octokit';

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
        auth: import.meta.env.GITHUB_ACCESS_TOKEN
    });
    const [feedbackFileURL, setFeedbackFileURL] = React.useState<string | null>(null);
    const [isError, setIsError] = React.useState<boolean>(false);

    const generateFeedbackContent = (challenge: Challenge, userAnswer: string) => {
        const mdContent = `# ${challenge.title}\n## 問題\n${challenge.description}\n## あなたの回答\n\`\`\`python\n${userAnswer}\n\`\`\``;
        return mdContent;
    };

    const saveFeedbackContentToGithub = async (feedbackContent: string): Promise<string> => {
        const fileName = `${Date.now()}.md`;
        try {
            const response = await octokit.request(`PUT /repos/{owner}/{repo}/contents/{path}`, {
                owner: GITHUB_REPO_OWNER,
                repo: GITHUB_REPO_NAME,
                path: fileName,
                branch: 'test/exhibition',
                message: `Add user feedback for ${challenge.title}. timestamp: ${Date.now()}`,
                content: btoa(encodeURIComponent(feedbackContent)),
            });

            const data = await response.json();
            return data.content.download_url;

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
    }, []);

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
                    <p>
                        フィードバックQRコードの生成中です...
                    </p>
                )
            }
        </div>
    )
};