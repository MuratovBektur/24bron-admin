git pull;

echo "🏗️  Сборка frontend..."
cd client && ./build.sh && cd ..

# Получаем имя docker compose команды
# (либо docker compose либо docker-compose)
source docker-compose-name.sh;

"${DOCKER_COMPOSE[@]}" -f docker-compose.dev.yml down -v;
"${DOCKER_COMPOSE[@]}" -f docker-compose.dev.yml up -d --build;
"${DOCKER_COMPOSE[@]}" -f docker-compose.dev.yml logs -f --tail=100;