using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using OhYeah.Data;
using OhYeah.Models;
using System.Linq;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace OhYeah.API
{
    [Route("api/[controller]")]
    [ApiController]
    public class TaskController : ControllerBase
    {
        private IServiceScopeFactory scopeFactory;
        public TaskController(IServiceScopeFactory _scopeFactory)
        {
            scopeFactory = _scopeFactory;
        }

        // GET: api/<Task>
        [HttpGet]
        public List<TaskModel> Get()
        {
            using (var scope = scopeFactory.CreateScope())
            {
                var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();
                var todoList = dbContext.Todo.Where(x => x.UserId == new Guid(id)).ToList();
                return dbContext.Task.Where(x => todoList.Any(t=>t.Id==x.TodoId)).ToList();
            }
            
        }

        // GET api/<Task>/5
        [HttpGet("{id}")]
        public async Task<TaskModel> Get(Guid id)
        {
            using (var scope = scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();
                return await dbContext.Task.FirstOrDefaultAsync(x => x.Id == id);
            }
        }

        // POST api/<Task>
        [HttpPost("{todoId}")]
        public async Task Post(Guid todoId, [FromBody] TaskModel value)
        {
            using (var scope = scopeFactory.CreateScope())
            {
                var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();
                if (dbContext.Todo.Any(x => x.UserId == new Guid(id) && x.Id==todoId))
                {
                    value.TodoId = todoId;
                    dbContext.Task.Add(value);
                    await dbContext.SaveChangesAsync();
                }
            }
        }

        // PUT api/<Task>/5
        [HttpPut]
        public async Task Put([FromBody] TaskModel value)
        {
            using (var scope = scopeFactory.CreateScope())
            {
                var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();
                var task = await dbContext.Task.FirstOrDefaultAsync(x => x.Id == value.Id);
                task.Content = value.Content;
                await dbContext.SaveChangesAsync();
            }
        }

        // DELETE api/<Task>/5
        [HttpDelete("{id}")]
        public async Task Delete(Guid id)
        {
            using (var scope = scopeFactory.CreateScope())
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var dbContext = scope.ServiceProvider.GetRequiredService<IdentityContext>();
                var task = await dbContext.Task.FirstOrDefaultAsync(x => x.Id == id);
                if (dbContext.Todo.Any(x => x.UserId == new Guid(userId) && x.Id == task.TodoId))
                {
                    dbContext.Task.Remove(task);
                    await dbContext.SaveChangesAsync();
                }
            }
        }
    }
}
