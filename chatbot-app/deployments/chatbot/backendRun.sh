cd /mnt/e/workspace/sentecneSimilar/chatbot-app/
docker compose build backend
docker tag chatbot-backend danhvm12345/chatbot-backend:latest 
docker push danhvm12345/chatbot-backend:latest 
cd /mnt/e/workspace/sentecneSimilar/chatbot-app/deployments/chatbot/
helm upgrade --install chatbot .
k get pod
# cd backend/
# docker ps
# npm build
# npm run build
# cd ..
# docker compose build backend 
# docker tag chatbot-backend danhvm12345/chatbot-backend:latest 
# docker push danhvm12345/chatbot-backend:latest 
# cd deployments/chatbot/
# helm upgrade --install .
# helm upgrade --install chatbot .
# k get po
# ls
# mkdir front-end.sh
# rm -rf front-end.sh/
# touch backendRun.sh
# history > backendRun.sh 
