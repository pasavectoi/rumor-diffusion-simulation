import React, { useState, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, UserCheck, UserX, Star } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const RumorDiffusionSimulation = () => {
  const TOTAL_PEOPLE = 200;

  const PersonType = {
    UNINFORMED: 'uninformed',
    BELIEVER: 'believer',
    DISBELIEVER: 'disbeliever'
  };

  const WisdomLevel = {
    WISE: 'wise',
    NORMAL: 'normal',
    GULLIBLE: 'gullible'
  };

  const [speed, setSpeed] = useState(50);
  const [people, setPeople] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [kols, setKols] = useState(2);
  const [wiseEffect, setWiseEffect] = useState(0.1);
  const [normalEffect, setNormalEffect] = useState(1.0);
  const [gullibleEffect, setGullibleEffect] = useState(3.0);
  const [diffusionData, setDiffusionData] = useState([]);
  const [startTime, setStartTime] = useState(null);

  const getPersonIcon = useCallback((type, isKol) => {
    const className = `w-6 h-6 ${
      isKol ? 'text-yellow-500' :
      type === PersonType.UNINFORMED ? 'text-gray-500' :
      type === PersonType.BELIEVER ? 'text-red-500' :
      'text-green-500'
    }`;

    return isKol ?
      <Star className={className} /> :
      type === PersonType.UNINFORMED ?
      <User className={className} /> :
      type === PersonType.BELIEVER ?
      <UserX className={className} /> :
      <UserCheck className={className} />;
  }, []);

  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const updateDiffusionData = useCallback((currentPeople) => {
    const currentTime = startTime ? (Date.now() - startTime) / 1000 : 0;
    const counts = {
      uninformed: currentPeople.filter(p => p.type === PersonType.UNINFORMED).length,
      believers: currentPeople.filter(p => p.type === PersonType.BELIEVER).length,
      disbelievers: currentPeople.filter(p => p.type === PersonType.DISBELIEVER).length
    };

    setDiffusionData(prev => {
      const newData = [...prev, {
        time: currentTime,
        uninformed: (counts.uninformed / TOTAL_PEOPLE) * 100,
        believers: (counts.believers / TOTAL_PEOPLE) * 100,
        disbelievers: (counts.disbelievers / TOTAL_PEOPLE) * 100
      }];
      return newData.slice(-100);
    });
  }, [startTime]);

  const initializePeople = useCallback(() => {
    const newPeople = Array.from({ length: TOTAL_PEOPLE }, (_, i) => ({
      id: i,
      x: Math.random() * 780,
      y: Math.random() * 380,
      dx: (Math.random() - 0.5) * 2,
      dy: (Math.random() - 0.5) * 2,
      type: i < kols ? PersonType.BELIEVER : PersonType.UNINFORMED,
      wisdom: i % 3 === 0 ? WisdomLevel.WISE :
              i % 3 === 1 ? WisdomLevel.NORMAL :
              WisdomLevel.GULLIBLE,
      isKol: i < kols,
      beliefTime: i < kols ? Date.now() : null
    }));

    setPeople(newPeople);
    setDiffusionData([{
      time: 0,
      uninformed: ((TOTAL_PEOPLE - kols) / TOTAL_PEOPLE) * 100,
      believers: (kols / TOTAL_PEOPLE) * 100,
      disbelievers: 0
    }]);
    setStartTime(Date.now());
  }, []); // 移除 kols 依赖

  useEffect(() => {
    initializePeople();
  }, [initializePeople]);

  const updateKols = useCallback((newKolCount) => {
    setPeople(currentPeople => {
      const newPeople = [...currentPeople];
      const currentKols = newPeople.filter(p => p.isKol);

      if (newKolCount < currentKols.length) {
        // 需要减少 KOL
        const numToRemove = currentKols.length - newKolCount;
        // 随机选择要移除的 KOL
        const shuffledKols = [...currentKols].sort(() => Math.random() - 0.5);
        for (let i = 0; i < numToRemove; i++) {
          shuffledKols[i].isKol = false;
        }
      } else if (newKolCount > currentKols.length) {
        // 需要增加 KOL
        const numToAdd = newKolCount - currentKols.length;
        // 从非 KOL 中随机选择
        const nonKols = newPeople.filter(p => !p.isKol);
        const shuffledNonKols = [...nonKols].sort(() => Math.random() - 0.5);

        for (let i = 0; i < numToAdd && i < shuffledNonKols.length; i++) {
          shuffledNonKols[i].isKol = true;
          if (shuffledNonKols[i].type === PersonType.UNINFORMED) {
            shuffledNonKols[i].type = PersonType.BELIEVER;
            shuffledNonKols[i].beliefTime = Date.now();
          }
        }
      }

      updateDiffusionData(newPeople);
      return newPeople;
    });
  }, [updateDiffusionData]);

  // 更新 KOL 滑块处理函数
  const handleKolChange = useCallback((value) => {
    const newKolCount = value[0];
    updateKols(newKolCount);
    setKols(newKolCount);
  }, [updateKols]);

  useEffect(() => {
    let intervalId;

    if (isRunning) {
      if (!startTime) setStartTime(Date.now());

      intervalId = setInterval(() => {
        setPeople(currentPeople => {
          const newPeople = currentPeople.map(person => {
            let dx = person.dx + (Math.random() - 0.5) * 0.2;
            let dy = person.dy + (Math.random() - 0.5) * 0.2;

            const velocity = Math.sqrt(dx * dx + dy * dy);
            const maxSpeed = 2;
            if (velocity > maxSpeed) {
              dx = (dx / velocity) * maxSpeed;
              dy = (dy / velocity) * maxSpeed;
            }

            const movementScale = speed / 50;

            let x = person.x + dx * movementScale;
            let y = person.y + dy * movementScale;

            if (x <= 0 || x >= 780) {
              dx = -dx;
              x = Math.max(0, Math.min(780, x));
            }
            if (y <= 0 || y >= 380) {
              dy = -dy;
              y = Math.max(0, Math.min(380, y));
            }

            return {
              ...person,
              x,
              y,
              dx,
              dy,
            };
          });

          // 处理信念传播
          newPeople.forEach((believer, i) => {
            if (believer.type !== PersonType.BELIEVER) return;

            newPeople.forEach((uninformed, j) => {
              if (i === j || uninformed.type !== PersonType.UNINFORMED) return;

              const dx = believer.x - uninformed.x;
              const dy = believer.y - uninformed.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < 30) {
                let beliefChance = 0.3;

                switch (uninformed.wisdom) {
                  case WisdomLevel.WISE:
                    beliefChance *= wiseEffect;
                    break;
                  case WisdomLevel.NORMAL:
                    beliefChance *= normalEffect;
                    break;
                  case WisdomLevel.GULLIBLE:
                    beliefChance *= gullibleEffect;
                    break;
                }

                if (believer.isKol) beliefChance *= 3;

                const rand = Math.random();
                if (rand < beliefChance) {
                  newPeople[j].type = PersonType.BELIEVER;
                  newPeople[j].beliefTime = Date.now();
                } else {
                  newPeople[j].type = PersonType.DISBELIEVER;
                  newPeople[j].beliefTime = null;
                }
              }
            });
          });

          updateDiffusionData(newPeople);
          return newPeople;
        });
      }, 50);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, speed, wiseEffect, normalEffect, gullibleEffect, updateDiffusionData, startTime]);

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Rumor Diffusion Simulation</CardTitle>
        <CardDescription>
          Explore how rumors spread among people, and the impact of individual judgment and key opinion leaders on information diffusion.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium mb-2">Legend:</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <span>Uninformed: Has not heard the rumor</span>
              </div>
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-500" />
                <span>Believer: Believes and spreads the rumor</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-500" />
                <span>Disbeliever: Heard but rejected the rumor</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>KOL: Key Opinion Leader (3x influence)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-48 bg-white rounded-lg overflow-hidden border">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={diffusionData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis
                dataKey="time"
                stroke="#888888"
                fontSize={12}
                tickFormatter={(value) => formatTime(Math.floor(value))}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#888888"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={(value) => `${Math.round(value)}%`}
                labelFormatter={(label) => `Time: ${formatTime(Math.floor(label))}`}
              />
              <Area
                type="monotone"
                dataKey="uninformed"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="believers"
                stackId="1"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="disbelievers"
                stackId="1"
                stroke="#22C55E"
                fill="#22C55E"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            onClick={() => {
              setIsRunning(false);
              initializePeople();
            }}
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Diffusion Speed</label>
              <span className="text-sm text-gray-500">{speed}</span>
            </div>
            <Slider
              value={[speed]}
              onValueChange={(value) => setSpeed(value[0])}
              min={1}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Number of KOLs</label>
              <span className="text-sm text-gray-500">{kols}</span>
            </div>
            <Slider
              value={[kols]}
              onValueChange={handleKolChange}
              min={0}
              max={5}
              step={1}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>None</span>
              <span>5</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Wise Judgement Effect</label>
              <span className="text-sm text-gray-500">{wiseEffect.toFixed(1)}x</span>
            </div>
            <Slider
              value={[wiseEffect]}
              onValueChange={(value) => setWiseEffect(value[0])}
              min={0.1}
              max={1.0}
              step={0.1}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Strong Judgement</span>
              <span>Average Judgement</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Gullible Influence</label>
              <span className="text-sm text-gray-500">{gullibleEffect.toFixed(1)}x</span>
            </div>
            <Slider
              value={[gullibleEffect]}
              onValueChange={(value) => setGullibleEffect(value[0])}
              min={1.0}
              max={3.0}
              step={0.1}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Normal</span>
              <span>High Influence</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg bg-gray-50" style={{ height: '400px', width: '800px', position: 'relative' }}>
          {people.map(person => (
            <div
              key={person.id}
              style={{
                position: 'absolute',
                left: `${person.x}px`,
                top: `${person.y}px`,
                transform: 'translate(-50%, -50%)',
                transition: 'all 50ms linear'
              }}
            >
              {getPersonIcon(person.type, person.isKol)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RumorDiffusionSimulation;