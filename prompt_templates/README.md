### Prompt Templates:
Includes predefined templates to guide the AI in filtering specific types of content.
1. **Filtering Insulting Language**
   - This prompt is designed to filter posts or replies containing insulting language based on user-provided criteria.
2. **Filtering Ads**
   - This prompt filters posts that resemble advertisements or promotional content.
3. **Filtering Low-Effort Posts and Replies**
   - This prompt identifies posts and replies that are low effort or add little value to the conversation.

### How It Works:
1. **User Input**: Users provide a description of the content they want to filter and activate a predefined or custom prompt template.
2. **Content Parsing**: The extension parses posts, replies, and contextual information (e.g., quoted content or profile details).
3. **AI Scoring**: The AI evaluates each post using the selected template and assigns a score from 1 to 100 based on the likelihood of removal.
4. **Actions**: Based on user-defined thresholds, posts can be flagged, removed, or acted upon (e.g., muted, blocked, or reported).

### Future Improvements: 
#### Standardizing Descriptions and Post Content:
- **Guided Description Templates**: Implement predefined templates or example-driven guidelines for writing user Descriptions to reduce ambiguity and ensure clarity across filters.  
- **Post Content Context Expansion**: Allow users to include optional metadata (e.g., thread context, quoted text, hashtags) alongside Post Content for more comprehensive evaluations.  
- **Validation Checks**: Add validation steps to ensure both Description and Post Content inputs meet minimum quality standards (e.g., sufficient detail, no empty fields).  
- **Field Structuring**: Introduce a structured format for inputs, such as categorizing Description elements (e.g., tone, intent, type of language) to improve AI consistency.  
- **Dynamic Feedback**: Provide immediate feedback on user-provided Descriptions, suggesting improvements or pointing out potential gaps in clarity or specificity.  