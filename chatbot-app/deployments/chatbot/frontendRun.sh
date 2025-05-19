cd /mnt/e/workspace/sentecneSimilar/chatbot-app/frontend
npm run build
cd /mnt/e/workspace/sentecneSimilar/chatbot-app/
docker compose build frontend
docker tag chatbot-frontend danhvm12345/chatbot-frontend:latest 
docker push danhvm12345/chatbot-frontend:latest 
cd /mnt/e/workspace/sentecneSimilar/chatbot-app/deployments/chatbot/
helm upgrade --install chatbot .
k get pod
# cd frontend/
# docker ps
# npm build
# npm run build
# cd ..
# docker compose build frontend 
# docker tag chatbot-frontend danhvm12345/chatbot-frontend:latest 
# docker push danhvm12345/chatbot-frontend:latest 
# cd deployments/chatbot/
# helm upgrade --install .
# helm upgrade --install chatbot .
# k get po
# ls
# mkdir front-end.sh
# rm -rf front-end.sh/
# touch frontendRun.sh
# history > frontendRun.sh 
