// Verified portfolio facts (from Sunil's resumes and portfolio). Edit here to change what the chatbot knows.
const SITE="https://protfolio-sunil-kulali.vercel.app/";
const KNOWLEDGE=`
PROFILE
- Name: Sunil Kulali. Based in Bengaluru, Karnataka, India.
- Positioning: AI Engineer | Generative AI | Machine Learning | Data Engineering. Also Data Analytics and Business Intelligence.
- Target roles: AI Engineer, Generative AI Engineer, Junior ML Engineer; also Data Analyst / BI roles.
- Summary: hands-on experience with LLM-powered applications, Retrieval-Augmented Generation (RAG) pipelines with LangChain and FAISS, text-to-SQL analytics workflows with LangGraph, FastAPI REST APIs on PostgreSQL, supervised ML in Python and Scikit-learn, and data engineering workflows on Azure.
- Status shown on the site: open to AI, ML and data roles.

EDUCATION
- B.E. in Computer Science and Engineering, Visvesvaraya Technological University (VTU), 2020-2024. (CGPA is not published on the portfolio.)

EXPERIENCE (two internships; do not describe them as full-time or senior roles)
- Machine Learning Intern, CODE-B Solutions Pvt. Ltd., Mumbai, July 2025 - October 2025: built supervised ML models (Random Forest, XGBoost, Logistic Regression) with feature engineering and hyperparameter tuning; outlier treatment and preprocessing (resume reports ~15% fewer model training errors); wrote SQL queries, views and stored procedures for model data; compared classifiers and communicated findings.
- IT Vedant, Bengaluru, June 2024 - April 2025 (titled Data Analyst Intern on one resume and Data Science Intern on the other): analysed 10,000+ records with Python (Pandas, NumPy) and SQL for cleaning, validation and EDA; built Power BI dashboards with DAX and Power Query for business KPIs; automated ETL/reporting workflows (resume reports 40% better reporting efficiency); implemented data-quality checks; documented SOPs.

SKILLS (only these are claimed)
- AI/ML: Python, Scikit-learn, XGBoost, Pandas, NumPy, feature engineering, model evaluation, supervised learning, hyperparameter tuning, MLflow. TensorFlow and PyTorch are foundational only.
- Generative AI: LLMs, RAG, LangChain, LangGraph, prompt engineering, LLM agents, text-to-SQL, embeddings, semantic search, vector databases, FAISS. Chroma, Pinecone, Weaviate are foundational only.
- Backend and databases: FastAPI, REST APIs, JWT, RBAC, SQL (CTEs, window functions, stored procedures), PostgreSQL, MySQL, SQL Server, ETL/ELT, React, Next.js, Streamlit.
- Cloud and data engineering: Google Cloud Platform, Azure Data Factory, Azure Data Lake Storage, Databricks, PySpark, Microsoft Fabric. Docker is foundational only.
- Analytics and BI: Power BI (DAX, Power Query, data modeling, KPI dashboards), Tableau, Excel (PivotTables, XLOOKUP), Matplotlib, Seaborn, EDA, data validation, data visualization.
- Tools: Git, GitHub, Jupyter Notebook, testing, debugging.

PROJECTS
1. InsightOS - Autonomous AI Business Intelligence and Decision Intelligence Platform. Stack: Python, FastAPI, Next.js, PostgreSQL, LangGraph, LLMs, RAG, text-to-SQL, Google Cloud. Turns natural-language business questions into insights via text-to-SQL and RAG, with LangGraph workflows for SQL analytics, root-cause analysis, forecasting, recommendations and automated reports. Multi-tenant design with RBAC, JWT authentication and tenant-level data isolation on PostgreSQL. SQL validation, audit logging, AI observability and human-in-the-loop approvals; data-source connectors and Google Cloud services for ingestion and deployment. Repository: https://github.com/SunilKulali/plusedataai
2. DataIntel AI - Generative AI-powered data analytics assistant. Stack: Python, FastAPI, React, PostgreSQL, LangChain, FAISS, RAG, Power BI. Answers business questions over structured data with a RAG pipeline (document processing, embeddings, FAISS vector search, LangChain) that grounds LLM responses in retrieved context. Schema-agnostic KPI classification engine; self-validation layer that recomputes KPIs and flags drift above 1%; 27-test backend regression suite; FastAPI endpoints linking AI services, databases and the React frontend; Power BI dashboards for KPI monitoring. Repository: https://github.com/SunilKulali/plusedataai (same repository as InsightOS).
3. Healthcare Data Lake - cloud data engineering and analytics platform. Stack: Azure Data Factory, Azure Data Lake Storage, Databricks, PySpark, SQL, Power BI, MLflow. Bronze/Silver/Gold medallion architecture for raw, cleansed and analytics-ready healthcare data; ETL/ELT with Azure Data Factory and PySpark including data quality checks; curated datasets and Power BI healthcare KPI dashboards; explored MLflow lifecycle management and AI-powered data retrieval. No public repository link is available.
4. Loan Approval Prediction and Credit Risk Analysis. Stack: Python, Pandas, Scikit-learn, Random Forest, Streamlit. End-to-end ML pipeline on 45,000+ records: preprocessing, feature engineering, comparison of five classifiers; Random Forest reached 90.2% accuracy (a reported project result, not a guarantee of real-world performance); deployed as an interactive Streamlit app. Repository: https://github.com/SunilKulali/loan-approval-app
5. RetailIQ - Retail Sales and Business Performance Analytics. Stack: SQL, Python, Pandas, Excel, Power BI, DAX. SQL analysis of sales trends, profitability, product performance and regional results; data cleaning and validation in Pandas; interactive Power BI dashboard with DAX measures, KPI cards, time trends and product/regional comparisons; automated data refresh via the Google Sheets API. Repository: https://github.com/SunilKulali/CrazyKart-Retail-data
6. Customer Churn and Retention Analysis. Stack: SQL, Python, Pandas, Scikit-learn, Power BI. Customer segmentation and churn analysis in SQL and Python, a churn classification model evaluated with classification metrics, and a Power BI dashboard for churn trends, segments and retention KPIs. Repository: https://github.com/SunilKulali/Customer-Churn-Analysis-Prediction-

CERTIFICATIONS (certificate files can be viewed in the Certifications section of the portfolio)
- Microsoft Certified: Fabric Data Engineer Associate (DP-700), Microsoft. A professional certification, earned August 9, 2026; the certificate shows an expiry of August 10, 2027 and is online verifiable.
- Master in Data Science and Analytics with Artificial Intelligence, IT Vedant Education Private Limited. A course certificate with Grade A, issued 18 March 2026.
- Python 101 for Data Science (PY0101EN), an IBM Developer Skills Network course delivered through IT Vedant. A course completion certificate issued February 7, 2025.
- Data Analytics and Visualization Job Simulation, Accenture (listed on the resume; no certificate file on the site)
- Databases and SQL for Data Science with Python, IBM (listed on the resume; no certificate file on the site)
- Machine Learning with Python, IBM (listed on the resume; no certificate file on the site)

LINKS AND CONTACT
- Portfolio: ${SITE}
- GitHub: https://github.com/SunilKulali
- LinkedIn: https://www.linkedin.com/in/sunilkulali/
- Email: sskulali3@gmail.com
- Sections on this site: #about, #skills, #experience, #projects, #certs, #resume (AI Engineer and Data Analyst resume PDFs), #contact. Visitors can also use the feedback button.

NOT KNOWN (say so and point to the contact section): years of experience beyond the two internships, salary expectations, notice period, work authorization, relocation, production user numbers, awards, anything not listed above.
`;
const SOURCES=[
 {title:"InsightOS / DataIntel AI repository",url:"https://github.com/SunilKulali/plusedataai",keys:["insightos","dataintel","plusedataai"]},
 {title:"Loan Approval repository",url:"https://github.com/SunilKulali/loan-approval-app",keys:["loan"]},
 {title:"RetailIQ repository",url:"https://github.com/SunilKulali/CrazyKart-Retail-data",keys:["retailiq","retail"]},
 {title:"Customer Churn repository",url:"https://github.com/SunilKulali/Customer-Churn-Analysis-Prediction-",keys:["churn"]},
 {title:"GitHub profile",url:"https://github.com/SunilKulali",keys:["github","repositor"]},
 {title:"LinkedIn",url:"https://www.linkedin.com/in/sunilkulali/",keys:["linkedin"]},
 {title:"Resume section",url:"#resume",keys:["resume","cv"]},
 {title:"Contact section",url:"#contact",keys:["contact","email","hire","hiring","opportunit"]},
 {title:"Projects section",url:"#projects",keys:["project","healthcare"]},
 {title:"Experience section",url:"#experience",keys:["intern","experience"]},
 {title:"Certifications section",url:"#certs",keys:["certif","dp-700"]},
 {title:"Skills section",url:"#skills",keys:["skill","technolog"]}
];
module.exports={KNOWLEDGE,SOURCES,SITE};
