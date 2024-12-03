import React, { FC } from 'react';
import { HistoryPageWrapper } from './HistoryPage.styled';

// Define the type for a history object
interface HistoryItem {
   username: string;
   url: string;
   content: string;
   preferencesAction: string;
   title: string;
   postScore: number;
 }
 
 // Define the props for the HistoryList component
 interface HistoryListProps {
   history: HistoryItem[];
 }
 
 // Sample data
 const historyData: HistoryItem[] = [
   {
     username: "JohnDoe",
     url: "https://example.com/post/1",
     content: "This is the content of the post.",
     preferencesAction: "Blocked - Insulting Language",
     title: "Post Title 1",
     postScore: 95,
   },
   {
     username: "JaneSmith",
     url: "https://example.com/post/2",
     content: "Another post with some content.",
     preferencesAction: "Muted - Video Games",
     title: "Post Title 2",
     postScore: 88,
   },
   // Add more history objects here
 ];

interface HistoryPageProps {}

const HistoryList: React.FC<HistoryListProps> = ({ history }) => {
   return (
     <div>
       <h1>History List</h1>
       <ul style={{ listStyleType: "none", padding: 0 }}>
         {history.map((item, index) => (
           <li
             key={index}
             style={{
               border: "1px solid #ddd",
               borderRadius: "8px",
               padding: "16px",
               marginBottom: "16px",
               backgroundColor: "#f9f9f9",
             }}
           >
             <h2 style={{ margin: "0 0 8px 0" }}>{item.title}</h2>
             <p>
               <strong>By:</strong> {item.username}
             </p>
             <p>
               <strong>Score:</strong> {item.postScore}
             </p>
             <p>
               <strong>Content:</strong> {item.content}
             </p>
             <p>
               <strong>Action:</strong> {item.preferencesAction}
             </p>
             <p>
               <a href={item.url} target="_blank" rel="noopener noreferrer">
                 View Post
               </a>
             </p>
           </li>
         ))}
       </ul>
     </div>
   );
 };
 const HistoryPage: React.FC = () => {
   return <HistoryList history={historyData} />;
 };

export default HistoryPage;